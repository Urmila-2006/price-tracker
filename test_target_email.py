import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.app.services.email_service import send_target_price_email
import datetime

try:
    check_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    send_target_price_email(
        to_email="eurmila2006@gmail.com",
        product_name="Test Product",
        target_price=100.0,
        old_price=150.0,
        current_price=90.0,
        currency="INR",
        product_url="http://example.com",
        check_time=check_time_str,
        image_url=None
    )
    print("Target price email test successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error during email send: {e}")
