from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    type = Column(String) # e.g., "PRICE_DROP", "TARGET_PRICE_REACHED"
    old_price = Column(Float, nullable=True)
    new_price = Column(Float, nullable=True)
    message = Column(String)
    status = Column(String, default="UNREAD") # "UNREAD", "READ"
    email_status = Column(String, default="pending") # "pending", "sent", "failed"
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    product = relationship("Product", back_populates="notifications")
