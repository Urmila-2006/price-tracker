from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.notification import Notification
from ..schemas.notification import NotificationResponse
from ..utils.auth import get_current_user

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)

@router.get("", response_model=List[NotificationResponse])
def get_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.sent_at.desc()).all()

@router.put("/{alert_id}/read", response_model=NotificationResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Notification).filter(Notification.id == alert_id, Notification.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "READ"
    db.commit()
    db.refresh(alert)
    return alert
