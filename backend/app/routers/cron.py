from fastapi import APIRouter, Depends, HTTPException, Header
from ..tasks.scraper_tasks import schedule_price_checks
from ..config import settings
import os

router = APIRouter(
    prefix="/api/cron",
    tags=["cron"]
)

@router.get("/check-prices")
def cron_check_prices(authorization: str = Header(None)):
    # Vercel sends the cron secret as a Bearer token
    cron_secret = os.environ.get("CRON_SECRET")
    
    # In development or if CRON_SECRET is not set, we might allow it (optional)
    # But for security, we enforce it if it's set in the environment.
    if cron_secret:
        if not authorization or authorization != f"Bearer {cron_secret}":
            raise HTTPException(status_code=401, detail="Unauthorized")
            
    stats = schedule_price_checks()
    return stats
