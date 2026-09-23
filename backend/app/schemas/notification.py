from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    type: str
    old_price: Optional[float]
    new_price: Optional[float]
    message: str
    status: str
    email_status: str
    sent_at: datetime

    class Config:
        from_attributes = True
