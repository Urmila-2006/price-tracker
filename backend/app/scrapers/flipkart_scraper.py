import re
import json
from .base_scraper import BaseScraper, ProductData, WebsiteBlockedException
from .generic_scraper import GenericScraper

class FlipkartScraper(BaseScraper):
    def fetch_page(self) -> None:
        super().fetch_page()
        
        # Detect Flipkart's anti-bot/verification page
        if self.soup and (self.soup.find(text=re.compile('Verify you are human', re.I)) or 
                          self.soup.find(text=re.compile('Please verify', re.I)) or
                          "px-captcha" in self.html.lower()):
            raise WebsiteBlockedException("Flipkart could not be accessed automatically. The website may require browser verification or may restrict automated requests.")

    def extract_product_data(self) -> ProductData:
        data: ProductData = {
            "name": None,
            "price": None,
            "currency": "INR",
            "image_url": None,
            "availability": True,
            "source": "flipkart.com"
        }
        
        if not self.soup: return data
        
        # 1. Try JSON-LD first (Flipkart usually embeds SEO structured data)
        # We can borrow the generic scraper's json-ld method
        generic = GenericScraper(self.url)
        generic.soup = self.soup
        json_data = generic._extract_json_ld()
        if json_data.get('price'):
            json_data["currency"] = "INR" # Force INR for flipkart
            return json_data
            
        # 2. Scrape specific Flipkart classes
        # Title
        title_el = self.soup.find("span", class_="B_NuCI") or self.soup.find("span", class_="VU-Tz5")
        if title_el:
            data["name"] = title_el.text.strip()
            
        # Price
        price_el = self.soup.find("div", class_="_30jeq3") or self.soup.find("div", class_="Nx9bqj")
        if price_el:
            price_text = price_el.text.replace('₹', '').replace(',', '').strip()
            try:
                data["price"] = float(price_text)
            except ValueError:
                pass
                
        # Image
        img_el = self.soup.find("img", class_="_396cs4") or self.soup.find("img", class_="v2-Gjv")
        if img_el and img_el.get('src'):
            data["image_url"] = img_el['src']
            
        # Availability
        sold_out = self.soup.find("div", class_="_16FRp0")
        if sold_out and "sold out" in sold_out.text.lower():
            data["availability"] = False

        return data
