from decimal import Decimal
from typing import Optional
from ..config import settings

def convert_usd_to_inr(usd_amount: Optional[float]) -> Optional[float]:
    if usd_amount is None:
        return None
    
    rate = Decimal(str(settings.USD_TO_INR_RATE))
    usd_val = Decimal(str(usd_amount))
    
    inr_val = usd_val * rate
    return float(round(inr_val, 2))
