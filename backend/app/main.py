import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, products, alerts, dashboard, catalog, cron
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PriceTracker API")

@app.on_event("startup")
def startup_event():
    if all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]):
        print("[EMAIL] SMTP configuration loaded successfully.")
    else:
        print("[EMAIL] SMTP configuration incomplete. Password reset emails are disabled.")

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(catalog.router)
app.include_router(cron.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PriceTracker API"}

from pydantic import BaseModel

class TestEmailRequest(BaseModel):
    email: str

@app.post("/api/test-email")
def test_email(request: TestEmailRequest):
    try:
        from .services.email_service import send_email
        send_email(request.email, "PriceTracker SMTP Test", "This is a test email from PriceTracker to verify SMTP settings.")
        return {"success": True, "message": "Test email sent successfully"}
    except Exception as e:
        return {"success": False, "message": f"SMTP Error: {str(e)}"}
