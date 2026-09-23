from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..schemas.catalog import PaginatedCatalogResponse, CatalogProduct
from ..providers import get_provider, ProductProvider
from ..services.currency import convert_usd_to_inr

router = APIRouter(
    prefix="/api/catalog",
    tags=["Catalog"]
)

def _convert_catalog_product(p: CatalogProduct) -> CatalogProduct:
    # Modify the product dict in place or create a new one to convert currency
    # Since p is a pydantic model, we can modify fields if allowed or create a copy
    # Wait, the provider returns dictionaries, but we can intercept at dict level or pydantic level.
    # provider returns dicts, not pydantic objects. Let's convert the dict.
    return p

def _convert_catalog_dict(data: dict) -> dict:
    if "products" in data:
        for p in data["products"]:
            if p.get("currency") == "USD":
                p["source_price"] = p["price"]
                p["source_currency"] = p["currency"]
                p["price"] = convert_usd_to_inr(p["price"])
                p["currency"] = "INR"
    return data

@router.get("/products", response_model=PaginatedCatalogResponse)
def get_catalog_products(
    q: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 20, 
    provider: ProductProvider = Depends(get_provider)
):
    try:
        if q:
            return _convert_catalog_dict(provider.search_products(q, skip, limit))
        return _convert_catalog_dict(provider.get_products(skip, limit))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories", response_model=List[str])
def get_catalog_categories(provider: ProductProvider = Depends(get_provider)):
    try:
        return provider.get_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category/{category}", response_model=PaginatedCatalogResponse)
def get_catalog_products_by_category(
    category: str, 
    skip: int = 0, 
    limit: int = 20, 
    provider: ProductProvider = Depends(get_provider)
):
    try:
        return _convert_catalog_dict(provider.get_products_by_category(category, skip, limit))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/{external_id}", response_model=CatalogProduct)
def get_catalog_product_details(
    external_id: str, 
    provider: ProductProvider = Depends(get_provider)
):
    try:
        p = provider.get_product_details(external_id)
        if p.get("currency") == "USD":
            p["source_price"] = p["price"]
            p["source_currency"] = p["currency"]
            p["price"] = convert_usd_to_inr(p["price"])
            p["currency"] = "INR"
        return p
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

