from urllib.parse import urlparse
from .base_scraper import BaseScraper
from .generic_scraper import GenericScraper
from .flipkart_scraper import FlipkartScraper

def get_scraper(url: str) -> BaseScraper:
    """Factory function to get the appropriate scraper for a given URL"""
    try:
        domain = urlparse(url).netloc.lower()
    except Exception:
        domain = ""
        
    if "flipkart.com" in domain:
        return FlipkartScraper(url)
        
    # Default to generic scraper
    return GenericScraper(url)
