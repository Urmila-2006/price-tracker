from .base_provider import ProductProvider
from .dummyjson_provider import DummyJSONProvider

def get_provider(provider_name: str = "dummyjson") -> ProductProvider:
    """
    Factory function to get the appropriate product provider.
    Currently defaults to DummyJSONProvider as it's our primary catalog.
    """
    if provider_name.lower() == "dummyjson":
        return DummyJSONProvider()
    
    # In the future, we can add:
    # if provider_name.lower() == "amazon":
    #     return AmazonProvider()
    # if provider_name.lower() == "flipkart":
    #     return FlipkartProvider()
        
    return DummyJSONProvider()
