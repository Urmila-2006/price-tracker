from abc import ABC, abstractmethod
from typing import TypedDict, Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
import time
import random

class ProductData(TypedDict):
    name: Optional[str]
    price: Optional[float]
    currency: str
    image_url: Optional[str]
    availability: bool
    source: str

class ScraperException(Exception):
    """Base class for scraper exceptions"""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class WebsiteBlockedException(ScraperException):
    def __init__(self, message: str = "This website is currently preventing automated access."):
        super().__init__(message, status_code=403)

class JSRequiredException(ScraperException):
    def __init__(self, message: str = "The product page requires browser rendering."):
        super().__init__(message, status_code=422)

class PageTimeoutException(ScraperException):
    def __init__(self, message: str = "The product page took too long to respond."):
        super().__init__(message, status_code=408)

class PriceNotFoundException(ScraperException):
    def __init__(self, message: str = "The product page was opened, but a price could not be identified."):
        super().__init__(message, status_code=422)

class InvalidURLException(ScraperException):
    def __init__(self, message: str = "Please enter a valid product URL."):
        super().__init__(message, status_code=400)


class BaseScraper(ABC):
    def __init__(self, url: str):
        self.url = url
        self.html: Optional[str] = None
        self.soup: Optional[BeautifulSoup] = None
        
        # Use common headers to avoid immediate blocks
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }

    @abstractmethod
    def extract_product_data(self) -> ProductData:
        """Must be implemented by child classes to extract the normalized data."""
        pass

    def fetch_page(self) -> None:
        """Fetches the page and parses it using BeautifulSoup."""
        if not self.url or not self.url.startswith('http'):
            raise InvalidURLException()
            
        try:
            time.sleep(random.uniform(0.5, 1.5)) # Slight delay to appear human
            response = requests.get(self.url, headers=self.headers, timeout=15)
            
            if response.status_code == 403 or response.status_code == 401 or 'captcha' in response.url.lower():
                raise WebsiteBlockedException()
                
            if response.status_code == 404:
                raise ScraperException("The product page could not be found (404).", status_code=404)
                
            response.raise_for_status()
            
            self.html = response.text
            self.soup = BeautifulSoup(self.html, 'html.parser')
            
        except requests.exceptions.Timeout:
            raise PageTimeoutException()
        except requests.exceptions.ConnectionError:
            raise ScraperException("Unable to connect to the product website.", status_code=503)
        except WebsiteBlockedException:
            raise
        except Exception as e:
            raise ScraperException("The product website could not be reached.", status_code=503)

    def get_product_data(self) -> ProductData:
        """Fetches the page and runs the extraction logic."""
        if not self.soup:
            self.fetch_page()
            
        data = self.extract_product_data()
        
        if not data['price']:
            raise PriceNotFoundException()
            
        return data
