import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from celery import Celery
from ..config import settings

celery_app = Celery(
    "pricetracker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.scraper_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "check-prices-every-1-minute": {
        "task": "app.tasks.scraper_tasks.schedule_price_checks",
        "schedule": 60.0, # Run every 1 minute to see who is due
    },
}
