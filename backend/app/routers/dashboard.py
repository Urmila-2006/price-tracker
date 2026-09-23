from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.notification import Notification
from ..utils.auth import get_current_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_products = db.query(Product).filter(Product.user_id == current_user.id).count()
    
    # We could consider "on sale" if there is a price drop notification, but let's just count recent price drops
    price_drops = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "PRICE_DROP"
    ).count()
    
    target_alerts = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "TARGET_PRICE_REACHED"
    ).count()
    
    # Get recent products
    recent_products = db.query(Product).filter(
        Product.user_id == current_user.id
    ).order_by(Product.created_at.desc()).limit(5).all()
    
    # Format the recent products to include basic info
    recent_formatted = []
    for p in recent_products:
        recent_formatted.append({
            "id": p.id,
            "name": p.name,
            "url": p.url,
            "current_price": p.current_price,
            "previous_price": p.previous_price,
            "currency": p.currency,
            "target_price": p.target_price,
            "image_url": p.image_url,
            "website": p.website
        })

    # Get recent alerts
    recent_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.sent_at.desc()).limit(5).all()

    recent_alerts_formatted = []
    for n in recent_notifications:
        recent_alerts_formatted.append({
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "old_price": n.old_price,
            "new_price": n.new_price,
            "status": n.status,
            "email_status": n.email_status,
            "sent_at": n.sent_at.isoformat(),
            "product_name": n.product.name if n.product else "Unknown Product"
        })

    return {
        "total_products": total_products,
        "price_drops": price_drops,
        "target_alerts": target_alerts,
        "recent_products": recent_formatted,
        "recent_alerts": recent_alerts_formatted
    }
