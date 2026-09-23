from pydantic import BaseModel
from typing import List, Optional

class CatalogProduct(BaseModel):
    external_id: str
    name: str
    description: str
    price: float
    currency: str
    discount: float
    rating: float
    stock: int
    brand: str
    category: str
    image_url: Optional[str]
    images: List[str]
    availability: bool
    source: str
    url: str
    source_price: Optional[float] = None
    source_currency: Optional[str] = None

class PaginatedCatalogResponse(BaseModel):
    products: List[CatalogProduct]
    total: int
    skip: int
    limit: int
