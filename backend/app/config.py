from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "pricetracker"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/pricetracker"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    JWT_SECRET: str = "super_secret_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    FRONTEND_URL: str = "http://localhost:5173"
    
    USD_TO_INR_RATE: float = 83.50
    DEMO_PRICE_SIMULATION: bool = True
    
    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

settings = Settings()
