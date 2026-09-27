import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from ..config import settings

def send_email(to_email: str, subject: str, body: str, html_body: str = None):
    print("[EMAIL] Preparing email")
    if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]):
        print("[EMAIL] Email sending skipped (SMTP not configured).")
        raise ValueError("SMTP configuration incomplete")

    print(f"[EMAIL] SMTP host configured: {settings.SMTP_HOST}")
    print(f"[EMAIL] SMTP port configured: {settings.SMTP_PORT}")
    print("[EMAIL] SMTP username configured: yes")
    print("[EMAIL] SMTP password configured: yes")
    
    msg = MIMEMultipart('alternative')
    msg['From'] = settings.SMTP_FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = Header(subject, 'utf-8')

    msg.attach(MIMEText(body, 'plain'))
    if html_body:
        msg.attach(MIMEText(html_body, 'html'))

    try:
        print("[EMAIL] Connecting to SMTP server")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        print("[EMAIL] Starting TLS")
        server.starttls()
        print("[EMAIL] Authenticating")
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        print("[EMAIL] Sending email")
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL] Successfully sent email to {to_email}")
    except Exception as e:
        print(f"[EMAIL] Failed to send email to {to_email}: {e}")
        raise e

def send_price_drop_email(to_email: str, product_name: str, old_price: float, new_price: float, currency: str, product_url: str):
    drop_amount = old_price - new_price
    percentage = (drop_amount / old_price) * 100
    currency_symbol = "₹" if currency == "INR" else ("$" if currency == "USD" else currency + " ")
    
    body = f"""
--------------------------------
PRICE DROP ALERT
--------------------------------

Product:
{product_name}

Previous Price:
{currency_symbol}{old_price:,.2f}

Current Price:
{currency_symbol}{new_price:,.2f}

You saved:
{currency_symbol}{drop_amount:,.2f}

Drop:
{percentage:.0f}%

View Product:
{product_url}

PriceTracker
--------------------------------
"""
    send_email(to_email, f"Price Drop Alert: {product_name}", body)

def send_target_price_email(to_email: str, product_name: str, target_price: float, old_price: float, current_price: float, currency: str, product_url: str, check_time: str, image_url: str = None):
    currency_symbol = "₹" if currency == "INR" else ("$" if currency == "USD" else currency + " ")
    
    prev_price_str = f"{currency_symbol}{old_price:,.2f}" if old_price is not None else "N/A"
    drop_amount = (old_price - current_price) if (old_price is not None) else 0
    percentage = (drop_amount / old_price * 100) if (old_price is not None and old_price > 0) else 0
    
    body = f"""Product: {product_name}
Previous Price: {prev_price_str}
Current Price: {currency_symbol}{current_price:,.2f}
Target Price: {currency_symbol}{target_price:,.2f}
Price drop percentage: {percentage:.2f}%
Date/time of check: {check_time}
Status: Target price reached

Link to the product/details page:
{product_url}
"""
    
    image_html = f'<div style="text-align: center; margin-bottom: 20px;"><img src="{image_url}" alt="{product_name}" style="max-width: 100%; height: auto; max-height: 200px; border-radius: 8px;"></div>' if image_url else ''

    html_body = f"""
    <html>
      <head></head>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          {image_html}
          <h2 style="color: #4f46e5;">PriceTracker Alert: Target Price Reached</h2>
          <p><strong>Product:</strong> {product_name}</p>
          <p><strong>Previous Price:</strong> {prev_price_str}</p>
          <p><strong>Current Price:</strong> {currency_symbol}{current_price:,.2f}</p>
          <p><strong>Target Price:</strong> {currency_symbol}{target_price:,.2f}</p>
          <p><strong>Price drop percentage:</strong> {percentage:.2f}%</p>
          <p><strong>Date/time of check:</strong> {check_time}</p>
          <p><strong>Status:</strong> Target price reached</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{product_url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Product</a>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        send_email(to_email, f"🎉 Target Price Reached – {product_name}", body, html_body)
    except Exception as e:
        raise e

def send_password_reset_email(to_email: str, reset_link: str):
    body = f"""Hello,

We received a request to reset your PriceTracker password.

Click the link below to create a new password:

{reset_link}

This link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.

If you did not request this, you can safely ignore this email.

PriceTracker Team
"""
    
    html_body = f"""
    <html>
      <head></head>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Reset your PriceTracker password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your PriceTracker password.</p>
          <p>Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">{reset_link}</p>
          <p>This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">If you did not request this password reset, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #999;">Regards,<br/>PriceTracker Team</p>
        </div>
      </body>
    </html>
    """
    
    send_email(to_email, "Reset your PriceTracker password", body, html_body)
