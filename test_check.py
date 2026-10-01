import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from backend.app.tasks.scraper_tasks import check_product_price

try:
    print("Testing check_product_price for product 5...")
    res = check_product_price(5, is_manual=True)
    print("Result:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Error:", e)
