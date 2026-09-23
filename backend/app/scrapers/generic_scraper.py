import json
import re
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper, ProductData

class GenericScraper(BaseScraper):
    def extract_product_data(self) -> ProductData:
        data: ProductData = {
            "name": None,
            "price": None,
            "currency": "USD",
            "image_url": None,
            "availability": True,
            "source": self.url.split('/')[2] if '//' in self.url else "Unknown"
        }
        
        # 1. Try structured data (JSON-LD)
        json_ld_data = self._extract_json_ld()
        if json_ld_data.get('price'):
            return json_ld_data
            
        # 2. Fallback to Meta Tags / Opengraph / Standard HTML attributes
        data["name"] = self._extract_meta_content("og:title") or self._extract_title()
        data["image_url"] = self._extract_meta_content("og:image")
        
        price_str = self._extract_meta_content("product:price:amount")
        if not price_str:
            # Fallback to finding common price classes
            price_str = self._find_price_in_html()
            
        currency_str = self._extract_meta_content("product:price:currency")
        if currency_str:
            data["currency"] = currency_str
            
        if price_str:
            data["price"] = self._clean_price(price_str)
            
        # Check availability string
        avail_str = self._extract_meta_content("product:availability")
        if avail_str and "outofstock" in avail_str.lower().replace(" ", ""):
            data["availability"] = False

        return data

    def _extract_json_ld(self) -> ProductData:
        data: ProductData = {
            "name": None,
            "price": None,
            "currency": "USD",
            "image_url": None,
            "availability": True,
            "source": self.url.split('/')[2] if '//' in self.url else "Unknown"
        }
        if not self.soup: return data
        
        scripts = self.soup.find_all("script", type="application/ld+json")
        for script in scripts:
            try:
                content = json.loads(script.string or "")
                # Handle both array and single object
                if isinstance(content, dict):
                    content = [content]
                    
                for item in content:
                    if item.get("@type") == "Product" or item.get("@type") == "ProductGroup":
                        data["name"] = item.get("name")
                        image = item.get("image")
                        if isinstance(image, list) and len(image) > 0:
                            data["image_url"] = image[0]
                        elif isinstance(image, str):
                            data["image_url"] = image
                            
                        offers = item.get("offers")
                        if isinstance(offers, list) and len(offers) > 0:
                            offers = offers[0]
                            
                        if isinstance(offers, dict):
                            price = offers.get("price")
                            if price:
                                data["price"] = float(price)
                            data["currency"] = offers.get("priceCurrency", "USD")
                            avail = offers.get("availability", "")
                            if "OutOfStock" in avail:
                                data["availability"] = False
                                
                        if data["price"] is not None:
                            return data
            except Exception:
                continue
        return data

    def _extract_meta_content(self, property_name: str) -> Optional[str]:
        if not self.soup: return None
        tag = self.soup.find("meta", property=property_name) or self.soup.find("meta", attrs={"name": property_name})
        return tag["content"] if tag and tag.get("content") else None
        
    def _extract_title(self) -> Optional[str]:
        if not self.soup: return None
        title_tag = self.soup.find("title")
        return title_tag.text.strip() if title_tag else None
        
    def _find_price_in_html(self) -> Optional[str]:
        if not self.soup: return None
        # Common classes for price
        classes_to_check = ['price', 'a-price-whole', 'product-price', 'offer-price']
        for c in classes_to_check:
            el = self.soup.find(class_=re.compile(c, re.I))
            if el and el.text:
                cleaned = re.sub(r'[^\d.]', '', el.text)
                if cleaned:
                    return cleaned
        return None

    def _clean_price(self, price_str: str) -> Optional[float]:
        try:
            cleaned = re.sub(r'[^\d.]', '', price_str)
            return float(cleaned)
        except ValueError:
            return None
