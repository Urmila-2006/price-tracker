from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from .user import UserResponse

class ProductBase(BaseModel):
    url: str
    target_price: Optional[float] = None
    check_interval: Optional[int] = 3600
    source: Optional[str] = "custom"
    external_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductPreviewRequest(BaseModel):
    url: str

class ProductPreviewResponse(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    currency: str = "USD"
    image_url: Optional[str] = None
    availability: bool = True
    source: str

class ProductUpdate(BaseModel):
    target_price: Optional[float] = None
    check_interval: Optional[int] = None
    is_active: Optional[bool] = None

class ProductAlertSettingsUpdate(BaseModel):
    target_price: Optional[float] = None
    check_interval: Optional[int] = None
    email_enabled: Optional[bool] = None
    browser_enabled: Optional[bool] = None

class PriceHistoryResponse(BaseModel):
    id: int
    price: float
    currency: str
    availability: bool
    checked_at: datetime

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: int
    name: Optional[str]
    image_url: Optional[str]
    website: Optional[str]
    current_price: Optional[float]
    currency: str
    source_price: Optional[float]
    source_currency: str
    availability: bool
    email_enabled: bool
    browser_enabled: bool
    last_checked_at: Optional[datetime]
    next_check_at: Optional[datetime] = None
    previous_price: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    user_id: int

    class Config:
        from_attributes = True

class ProductWithHistoryResponse(ProductResponse):
    price_history: List[PriceHistoryResponse] = []
