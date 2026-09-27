import sys
import os
from sqlalchemy import text

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.database import engine

def apply_migrations():
    print("Applying database migrations...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN email_enabled BOOLEAN DEFAULT TRUE;"))
            print("Added email_enabled to products")
        except Exception as e:
            print(f"Skipped email_enabled: {e}")
            
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN browser_enabled BOOLEAN DEFAULT FALSE;"))
            print("Added browser_enabled to products")
        except Exception as e:
            print(f"Skipped browser_enabled: {e}")

        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN target_price_notified BOOLEAN DEFAULT FALSE;"))
            print("Added target_price_notified to products")
        except Exception as e:
            print(f"Skipped target_price_notified: {e}")
            
        try:
            # Convert existing check_interval from seconds to minutes, defaulting minimum to 15 mins (if some had 0)
            conn.execute(text("UPDATE products SET check_interval = GREATEST(15, check_interval / 60);"))
            print("Converted check_interval to minutes")
        except Exception as e:
            print(f"Failed to convert check_interval: {e}")
            
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN email_status VARCHAR DEFAULT 'pending';"))
            print("Added email_status to notifications")
        except Exception as e:
            print(f"Skipped email_status: {e}")
            
        conn.commit()
    print("Migrations complete.")

if __name__ == "__main__":
    apply_migrations()
