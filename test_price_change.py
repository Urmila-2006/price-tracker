import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal
from backend.app.models.product import Product
from backend.app.tasks.scraper_tasks import check_product_price

db = SessionLocal()
product = db.query(Product).first()

if not product:
    print("No products in DB!")
else:
    print(f"Testing product: {product.id} - {product.name}")
    print(f"Current price before check: {product.current_price}")
    
    check_product_price(product.id, is_manual=True)
    
    db.refresh(product)
    print(f"Price after check_product_price returned: {product.current_price}")

db.close()
