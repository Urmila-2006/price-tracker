import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from backend.app.services.email_service import send_email

try:
    send_email(
        "urmilaeadiga2726@gmail.com",
        "Test Subject",
        "This is a test body",
        "<p>This is a test body</p>"
    )
    print("Email test successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error during email send: {e}")
