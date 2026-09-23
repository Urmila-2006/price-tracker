from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.price_history import PriceHistory
from ..schemas.product import ProductCreate, ProductResponse, ProductUpdate, ProductAlertSettingsUpdate, ProductWithHistoryResponse, PriceHistoryResponse, ProductPreviewRequest, ProductPreviewResponse
from ..utils.auth import get_current_user
from ..scrapers import get_scraper, ScraperException

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Product).filter(Product.user_id == current_user.id).all()

@router.post("/preview", response_model=ProductPreviewResponse)
def preview_product(request: ProductPreviewRequest, current_user: User = Depends(get_current_user)):
    scraper = get_scraper(request.url)
    try:
        product_data = scraper.get_product_data()
        return product_data
    except ScraperException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching the product preview.")

@router.post("", response_model=ProductResponse)
def add_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from ..services.currency import convert_usd_to_inr
    
    if product.source and product.source != "custom" and product.external_id:
        from ..providers import get_provider
        provider = get_provider(product.source)
        try:
            product_data = provider.get_product_details(product.external_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch product from provider: {str(e)}")
            
        orig_price = product_data.get('price')
        orig_currency = product_data.get('currency', 'USD')
        
        if orig_currency == 'USD':
            current_price = convert_usd_to_inr(orig_price)
            currency = 'INR'
            source_price = orig_price
            source_currency = orig_currency
        else:
            current_price = orig_price
            currency = orig_currency
            source_price = orig_price
            source_currency = orig_currency

        db_product = Product(
            user_id=current_user.id,
            url=product.url,
            source=product.source,
            external_id=product.external_id,
            name=product_data.get('name') or "Unknown Product",
            image_url=product_data.get('image_url'),
            current_price=current_price,
            currency=currency,
            source_price=source_price,
            source_currency=source_currency,
            availability=product_data.get('availability', True),
            target_price=product.target_price,
            check_interval=product.check_interval,
            website=product.source,
            last_checked_at=datetime.now(timezone.utc)
        )
    else:
        scraper = get_scraper(product.url)
        try:
            product_data = scraper.get_product_data()
        except ScraperException as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except Exception as e:
            raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching the product.")
            
        orig_price = product_data.get('price')
        orig_currency = product_data.get('currency', 'USD')
        
        if orig_currency == 'USD':
            current_price = convert_usd_to_inr(orig_price)
            currency = 'INR'
            source_price = orig_price
            source_currency = orig_currency
        else:
            current_price = orig_price
            currency = orig_currency
            source_price = orig_price
            source_currency = orig_currency
            
        db_product = Product(
            user_id=current_user.id,
            url=product.url,
            source="custom",
            name=product_data.get('name') or "Unknown Product",
            image_url=product_data.get('image_url'),
            current_price=current_price,
            currency=currency,
            source_price=source_price,
            source_currency=source_currency,
            availability=product_data.get('availability', True),
            target_price=product.target_price,
            check_interval=product.check_interval,
            website=product.url.split('/')[2] if '//' in product.url else "Unknown",
            last_checked_at=datetime.now(timezone.utc)
        )
        
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Store initial price history
    initial_history = PriceHistory(
        product_id=db_product.id,
        price=db_product.current_price,
        currency=db_product.currency,
        availability=db_product.availability
    )
    db.add(initial_history)
    db.commit()
    
    return db_product

@router.get("/{product_id}", response_model=ProductWithHistoryResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product_update.target_price is not None:
        db_product.target_price = product_update.target_price
    if product_update.check_interval is not None:
        db_product.check_interval = product_update.check_interval
    if product_update.is_active is not None:
        db_product.is_active = product_update.is_active
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}/alert-settings", response_model=ProductResponse)
def update_alert_settings(product_id: int, settings_update: ProductAlertSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if settings_update.target_price is not None:
        db_product.target_price = settings_update.target_price
    if settings_update.check_interval is not None:
        db_product.check_interval = settings_update.check_interval
    if settings_update.email_enabled is not None:
        db_product.email_enabled = settings_update.email_enabled
    if settings_update.browser_enabled is not None:
        db_product.browser_enabled = settings_update.browser_enabled
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"detail": "Product deleted"}

@router.post("/{product_id}/check-price", response_model=ProductResponse)
def check_price_now(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    from ..tasks.scraper_tasks import check_product_price
    try:
        check_product_price(db_product.id, is_manual=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check price: {str(e)}")
        
    db.refresh(db_product)
    return db_product
