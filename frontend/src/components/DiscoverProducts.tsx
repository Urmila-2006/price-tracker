import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from './ProductCard';
import { Search, Smartphone, Laptop, Watch, Shirt, Sparkles, Sofa, ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('phone') || cat.includes('mobile')) return <Smartphone className="h-5 w-5" />;
  if (cat.includes('laptop') || cat.includes('computer')) return <Laptop className="h-5 w-5" />;
  if (cat.includes('watch') || cat.includes('time')) return <Watch className="h-5 w-5" />;
  if (cat.includes('shirt') || cat.includes('clothing') || cat.includes('dress') || cat.includes('shoes')) return <Shirt className="h-5 w-5" />;
  if (cat.includes('beauty') || cat.includes('fragrance') || cat.includes('makeup')) return <Sparkles className="h-5 w-5" />;
  if (cat.includes('furniture') || cat.includes('home')) return <Sofa className="h-5 w-5" />;
  return <ShoppingBag className="h-5 w-5" />;
};

export default function DiscoverProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setProducts([]);
    setSkip(0);
    setHasMore(true);
    fetchProducts(true);
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/catalog/categories');
      setCategories(['All', ...res.data]);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProducts = async (reset: boolean = false) => {
    setLoading(true);
    try {
      let endpoint = '/products/search';
      let params: any = {};
      
      if (searchQuery) {
        params.q = searchQuery;
      } else if (selectedCategory !== 'All') {
        params.q = selectedCategory;
      } else {
        params.q = 'trending products';
      }

      const res = await api.get(endpoint, { params });
      
      const mappedProducts = res.data.map((item: any) => ({
        external_id: item.id || item.product_link,
        name: item.title,
        description: '',
        price: item.extracted_price || 0,
        currency: 'INR',
        discount: item.extracted_old_price ? Math.round((1 - (item.extracted_price / item.extracted_old_price)) * 100) : 0,
        rating: item.rating || 0,
        stock: 100,
        brand: '',
        category: selectedCategory !== 'All' ? selectedCategory : 'Product',
        image_url: item.thumbnail,
        images: [item.thumbnail],
        availability: true,
        source: item.merchant || 'Unknown',
        url: item.product_link
      }));
      
      if (reset) {
        setProducts(mappedProducts);
      } else {
        setProducts(prev => [...prev, ...mappedProducts]);
      }
      
      // SerpApi doesn't easily support pagination the same way, we just disable infinite scroll for now
      setHasMore(false);
    } catch (err) {
      console.error('Failed to fetch products', err);
      // Let the user know if SerpApi fails
      alert('Unable to fetch shopping results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    fetchProducts(false);
  };

  const handleTrackProduct = async (product: any) => {
    try {
      const res = await api.post('/products', {
        url: product.url,
        target_price: null,
        check_interval: 3600,
        source: 'google_shopping',
        external_id: product.external_id,
        name: product.name,
        image_url: product.image_url,
        current_price: product.price,
        currency: product.currency,
        merchant: product.source
      });
      navigate(`/products/${res.data.id}`);
    } catch (err) {
      console.error('Failed to track product', err);
      alert('Failed to track product');
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Search Section */}
      <div className="relative mx-auto max-w-3xl">
        <div className="group relative rounded-2xl bg-white p-2 shadow-sm transition-all duration-300 focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/50">
          <div className="pointer-events-none absolute inset-y-0 left-6 flex items-center">
            <Search className="h-6 w-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
          </div>
          <input
            type="text"
            className="w-full rounded-xl bg-transparent py-4 pl-14 pr-12 text-lg outline-none placeholder:text-gray-400"
            placeholder="Search for laptops, watches, shoes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-6 flex items-center justify-center"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                <X className="h-4 w-4" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Browse Categories</h3>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat && !searchQuery;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(cat);
                }}
                className={`flex snap-start shrink-0 items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-100'
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 hover:scale-105 scale-100'
                }`}
              >
                <div className={`${isSelected ? 'text-white' : 'text-indigo-500'} transition-colors duration-300`}>
                  {getCategoryIcon(cat)}
                </div>
                <span className="font-semibold whitespace-nowrap">
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Section */}
      <div>
        <h3 className="mb-6 text-2xl font-extrabold text-gray-900">
          {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Featured Products' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('-', ' ')}`)}
        </h3>

        {products.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/50 backdrop-blur-sm border border-white/60 py-24 shadow-sm">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
              <Search className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm text-center">We couldn't find anything matching your search. Try adjusting your keywords or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
              <ProductCard 
                key={product.external_id} 
                product={product} 
                onClick={() => handleTrackProduct(product)} 
              />
            ))}
            
            {/* Skeleton Loading State */}
            {loading && Array.from({ length: products.length > 0 ? 4 : 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse">
                <div className="h-48 w-full bg-gray-200"></div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 h-4 w-1/3 rounded bg-gray-200"></div>
                  <div className="mb-4 h-5 w-3/4 rounded bg-gray-200"></div>
                  <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="h-6 w-1/3 rounded bg-gray-200"></div>
                    <div className="h-10 w-1/3 rounded-xl bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && products.length > 0 && (
          <div className="flex justify-center pt-10">
            <button
              onClick={handleLoadMore}
              className="rounded-full bg-white px-8 py-3.5 font-bold text-indigo-600 shadow-sm border border-indigo-100 hover:bg-indigo-50 hover:shadow-md hover:border-indigo-200 transition-all duration-300"
            >
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
