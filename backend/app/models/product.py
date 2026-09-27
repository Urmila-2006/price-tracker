from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import timedelta
from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    url = Column(String, index=True, nullable=False)
    source = Column(String, default="custom")
    external_id = Column(String, index=True, nullable=True)
    name = Column(String, index=True)
    image_url = Column(String, nullable=True)
    website = Column(String, index=True)
    current_price = Column(Float, nullable=True)
    target_price = Column(Float, nullable=True)
    currency = Column(String, default="INR")
    source_price = Column(Float, nullable=True)
    source_currency = Column(String, default="USD")
    availability = Column(Boolean, default=True)
    check_interval = Column(Integer, default=60) # In minutes
    email_enabled = Column(Boolean, default=True)
    target_price_notified = Column(Boolean, default=False)
    browser_enabled = Column(Boolean, default=False)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True) # Used for pausing tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="products")
    price_history = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="product", cascade="all, delete-orphan")

    @property
    def next_check_at(self):
        if not self.last_checked_at or not self.is_active:
            return None
        return self.last_checked_at + timedelta(minutes=self.check_interval)

    @property
    def previous_price(self):
        if not self.price_history or len(self.price_history) < 2:
            return None
        sorted_history = sorted(self.price_history, key=lambda x: x.checked_at, reverse=True)
        return sorted_history[1].price
