# Celery has been removed for Vercel compatibility
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from ..database import SessionLocal
from ..models.product import Product
from ..models.price_history import PriceHistory
from ..models.notification import Notification
from ..models.user import User
from ..scrapers import get_scraper, ScraperException
from ..services.email_service import send_price_drop_email, send_target_price_email

def schedule_price_checks():
    db = SessionLocal()
    stats = {"checked": 0, "price_updates": 0, "target_reached": 0, "emails_sent": 0}
    try:
        now = datetime.now(timezone.utc)
        
        # Find products that are active and due for checking
        # (last_checked_at is None) OR (now - last_checked_at >= check_interval)
        products = db.query(Product).filter(Product.is_active == True).all()
        
        due_products = []
        for product in products:
            due = False
            if not product.last_checked_at:
                due = True
            else:
                # Calculate difference. If last_checked_at is naive, assume UTC.
                last_checked = product.last_checked_at
                if last_checked.tzinfo is None:
                    last_checked = last_checked.replace(tzinfo=timezone.utc)
                
                if (now - last_checked).total_seconds() >= product.check_interval * 60:
                    due = True
                
            if due:
                due_products.append(product)
                
        if due_products:
            stats["checked"] = len(due_products)
            print(f"[PRICE CHECK] Found {len(due_products)} products due for update")
            for product in due_products:
                print(f"[PRICE CHECK] Product={product.id} Old={product.currency} {product.current_price}")
                res = check_product_price(product.id)
                if res:
                    if res.get("price_updated"): stats["price_updates"] += 1
                    if res.get("target_reached"): stats["target_reached"] += 1
                    if res.get("email_sent"): stats["emails_sent"] += 1
        else:
            print("[PRICE CHECK] No products currently due")
            
        return stats
    finally:
        db.close()

def check_product_price(product_id: int, is_manual: bool = False):
    db = SessionLocal()
    try:
        from ..services.currency import convert_usd_to_inr
        from ..config import settings
        
        if is_manual:
            print("[CHECK PRICE] REQUEST RECEIVED")
            print(f"[CHECK PRICE] PRODUCT ID = {product_id}")
            
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product or not product.is_active:
            return {}
            
        stats = {"price_updated": False, "target_reached": False, "email_sent": False}
            
        if is_manual:
            print(f"[CHECK PRICE] OLD PRICE = {product.current_price}")
            
        is_demo_mode = getattr(settings, 'DEMO_PRICE_SIMULATION', False)
        
        # If it's dummyjson in demo mode, skip scraping entirely
        if is_demo_mode and (product.source == 'dummyjson' or 'dummyjson' in product.url):
            new_price = product.current_price
            new_currency = product.currency
            data = {'availability': True}
        else:
            scraper = get_scraper(product.url)
            try:
                data = scraper.get_product_data()
            except ScraperException as e:
                print(f"Scraper error for {product.url}: {e.message}")
                return {}
                
            orig_price = data.get('price')
            
            if not orig_price:
                print(f"Failed to extract price for {product.url}")
                return {}
                
            orig_currency = data.get('currency', 'USD')
            if orig_currency == 'USD':
                new_price = convert_usd_to_inr(orig_price)
                new_currency = 'INR'
            else:
                new_price = orig_price
                new_currency = orig_currency
            
        if is_demo_mode:
            if product.current_price:
                if is_manual:
                    # Deterministic drop for testing
                    new_price = round(product.current_price * 0.97, 2)
                else:
                    import random
                    # Random fluctuation between -15% and +5% (favoring drops)
                    fluctuation = random.uniform(-0.15, 0.05)
                    new_price = round(product.current_price * (1 + fluctuation), 2)
                    # Ensure price never drops to <= 0 or wildly low unexpectedly
                    if new_price < (product.current_price * 0.5):
                        new_price = round(product.current_price * 0.9, 2)
            else:
                new_price = round(new_price, 2)
        else:
            new_price = round(new_price, 2)

        if is_manual:
            print(f"[CHECK PRICE] NEW PRICE = {new_price}")
            print("[CHECK PRICE] UPDATING DATABASE")

        old_price = product.current_price
        price_changed = (old_price is None or new_price != old_price)
        
        # Handle first time price check or price change
        if price_changed:
            product.current_price = new_price
            product.currency = new_currency
            stats["price_updated"] = True
            
            history = PriceHistory(
                product_id=product.id,
                price=new_price,
                currency=new_currency,
                availability=data.get('availability', True)
            )
            db.add(history)
            
            # Commit price and history updates before notifications
            db.commit()
            
            if is_manual:
                print("[CHECK PRICE] HISTORY CREATED")
            
        # Notifications logic
        user = db.query(User).filter(User.id == product.user_id).first()
        if user:
            # 1. Price drop
            if price_changed and old_price is not None and new_price < old_price:
                recent_notif = db.query(Notification).filter(
                    Notification.product_id == product.id,
                    Notification.type == "PRICE_DROP",
                    Notification.new_price == new_price
                ).order_by(Notification.sent_at.desc()).first()
                
                if not recent_notif:
                    drop_notif = Notification(
                        user_id=user.id,
                        product_id=product.id,
                        type="PRICE_DROP",
                        old_price=old_price,
                        new_price=new_price,
                        message=f"Price dropped from {new_currency} {old_price} to {new_currency} {new_price}"
                    )
                    db.add(drop_notif)
                    
                    if product.email_enabled:
                        print("[PRICE ALERT] Target/price-drop condition reached")
                        print(f"[PRICE ALERT] User ID: {user.id}")
                        print(f"[PRICE ALERT] Product: {product.name}")
                        print(f"[PRICE ALERT] Current price: {new_price}")
                        target_str = product.target_price if product.target_price is not None else "N/A"
                        print(f"[PRICE ALERT] Target price: {target_str}")
                        print("[PRICE ALERT] Sending email...")
                        
                        try:
                            send_price_drop_email(user.email, product.name, old_price, new_price, new_currency, product.url)
                            drop_notif.email_status = "sent"
                            print("[PRICE ALERT] Email sent successfully")
                        except Exception as e:
                            print(f"[PRICE ALERT] Email failed: {e}")
                            drop_notif.email_status = "failed"

            # 2. Target price
            if product.target_price and new_price <= product.target_price:
                # Atomically claim the right to send the notification
                updated_rows = db.query(Product).filter(
                    Product.id == product.id, 
                    Product.target_price_notified == False
                ).update({"target_price_notified": True}, synchronize_session=False)
                db.commit() # Commit the claim
                
                if updated_rows > 0:
                    print(f"""
TARGET PRICE CHECK
Product: {product.name}
Current price: {new_currency} {new_price}
Target price: {new_currency} {product.target_price}
Target reached: YES
""")
                    stats["target_reached"] = True
                    recent_target_notif = db.query(Notification).filter(
                        Notification.product_id == product.id,
                        Notification.type == "TARGET_PRICE_REACHED"
                    ).order_by(Notification.sent_at.desc()).first()
                    
                    # Create a new notification record if we haven't sent one for this drop
                    target_notif = Notification(
                        user_id=user.id,
                        product_id=product.id,
                        type="TARGET_PRICE_REACHED",
                        old_price=old_price,
                        new_price=new_price,
                        message=f"Target price {new_currency} {product.target_price} reached! Current: {new_currency} {new_price}"
                    )
                    db.add(target_notif)
                    
                    if product.email_enabled:
                        print("[PRICE ALERT] Sending email...")
                        
                        try:
                            check_time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            send_target_price_email(
                                user.email, 
                                product.name, 
                                product.target_price,
                                old_price,
                                new_price, 
                                new_currency, 
                                product.url,
                                check_time_str,
                                image_url=product.image_url
                            )
                            target_notif.email_status = "sent"
                            stats["email_sent"] = True
                            print("[PRICE ALERT] Email sent successfully")
                            print("Notification sent: YES")
                        except Exception as e:
                            print(f"[PRICE ALERT] Email failed: {e}")
                            target_notif.email_status = "failed"
                            print("Notification sent: NO")
                            
                            # Revert the claim since email failed
                            db.query(Product).filter(Product.id == product.id).update({"target_price_notified": False}, synchronize_session=False)
                            db.commit()
        
        # Always update last_checked_at
        product.last_checked_at = datetime.now(timezone.utc)
        if data.get('availability') is not None:
            product.availability = data['availability']
            
        db.commit()
        
        if is_manual:
            db.refresh(product)
            print("[CHECK PRICE] DATABASE COMMITTED")
            print(f"[CHECK PRICE] STORED PRICE = {product.current_price}")
            print(f"[CHECK PRICE] NEXT CHECK = {product.next_check_at}")
            print("[CHECK PRICE] RESPONSE SENT")
        else:
            print(f"[PRICE CHECK] Product={product.id} New={new_currency} {new_price} NextCheck={product.next_check_at}")
            
        return stats
            
    except Exception as e:
        print(f"Error checking price for product {product_id}: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()

