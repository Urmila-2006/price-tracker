from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class ProductProvider(ABC):
    """
    Abstract base class for all product providers (e.g., DummyJSON, FakeStore, Amazon, etc.)
    """
    
    @abstractmethod
    def search_products(self, query: str, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        """Search products by query."""
        pass
        
    @abstractmethod
    def get_products(self, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        """Get all products with pagination."""
        pass
        
    @abstractmethod
    def get_categories(self) -> List[str]:
        """Get a list of all available categories."""
        pass
        
    @abstractmethod
    def get_products_by_category(self, category: str, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        """Get products for a specific category with pagination."""
        pass
        
    @abstractmethod
    def get_product_details(self, external_id: str) -> Dict[str, Any]:
        """Get detailed information for a specific product by its external ID."""
        pass
