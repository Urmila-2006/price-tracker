import requests
from typing import Dict, Any, List
from .base_provider import ProductProvider

class DummyJSONProvider(ProductProvider):
    BASE_URL = "https://dummyjson.com/products"

    def _map_product(self, item: dict) -> dict:
        return {
            "external_id": str(item.get("id")),
            "name": item.get("title", "Unknown"),
            "description": item.get("description", ""),
            "price": float(item.get("price", 0.0)),
            "currency": "USD",
            "discount": float(item.get("discountPercentage", 0.0)),
            "rating": float(item.get("rating", 0.0)),
            "stock": int(item.get("stock", 0)),
            "brand": item.get("brand", "Unknown"),
            "category": item.get("category", "Uncategorized"),
            "image_url": item.get("thumbnail"),
            "images": item.get("images", []),
            "availability": int(item.get("stock", 0)) > 0,
            "source": "dummyjson",
            "url": f"https://dummyjson.com/products/{item.get('id')}"
        }

    def _map_response(self, data: dict) -> dict:
        return {
            "products": [self._map_product(p) for p in data.get("products", [])],
            "total": data.get("total", 0),
            "skip": data.get("skip", 0),
            "limit": data.get("limit", 0)
        }

    def search_products(self, query: str, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        response = requests.get(f"{self.BASE_URL}/search", params={"q": query, "skip": skip, "limit": limit})
        response.raise_for_status()
        return self._map_response(response.json())

    def get_products(self, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        response = requests.get(self.BASE_URL, params={"skip": skip, "limit": limit})
        response.raise_for_status()
        return self._map_response(response.json())

    def get_categories(self) -> List[str]:
        # DummyJSON category list is a list of strings
        response = requests.get(f"{self.BASE_URL}/categories")
        response.raise_for_status()
        # Newer dummyjson API returns objects for categories sometimes, handle both
        data = response.json()
        if data and isinstance(data[0], dict):
            return [cat.get("slug") for cat in data]
        return data

    def get_products_by_category(self, category: str, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        response = requests.get(f"{self.BASE_URL}/category/{category}", params={"skip": skip, "limit": limit})
        response.raise_for_status()
        return self._map_response(response.json())

    def get_product_details(self, external_id: str) -> Dict[str, Any]:
        response = requests.get(f"{self.BASE_URL}/{external_id}")
        response.raise_for_status()
        return self._map_product(response.json())
