import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from backend.app.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.product import Product

db = SessionLocal()
users = db.query(User).all()
print("Users:")
for u in users:
    print(f"ID: {u.id}, Email: {u.email}")
    
products = db.query(Product).all()
print("\nProducts:")
for p in products:
    print(f"ID: {p.id}, User ID: {p.user_id}, Name: {p.name}, Current Price: {p.current_price}, Target Price: {p.target_price}, Target Notified: {p.target_price_notified}, Email Enabled: {p.email_enabled}")

db.close()
