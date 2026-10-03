import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, TrendingDown, ArrowRight, Activity, Plus, Heart, Star } from 'lucide-react';
import { formatRelativeTime } from '../utils/date';
import PriceDisplay from '../components/PriceDisplay';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">My Products</h2>
          <p className="mt-1 text-sm text-gray-500">Manage and track your saved items.</p>
        </div>
        <Link 
          to="/products/add" 
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
          <div className="mb-4 rounded-full bg-indigo-50 p-4">
            <Package size={48} className="text-indigo-200" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">No products tracked yet</h3>
          <p className="mb-6 max-w-sm text-gray-500">Add your first product to start tracking its price history and get notified when it drops.</p>
          <Link to="/products/add" className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(product => {
            const isPriceDrop = product.target_price && product.current_price <= product.target_price;
            const hasDiscount = product.current_price && product.previous_price && product.current_price < product.previous_price;
            const discountPercent = hasDiscount ? (((product.previous_price - product.current_price) / product.previous_price) * 100).toFixed(1) : 0;
            
            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-indigo-100 relative"
              >
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                    {discountPercent}% OFF
                  </div>
                )}
                
                <div className="absolute top-4 right-4 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10 shadow-sm backdrop-blur-sm">
                  <Heart className="h-4 w-4" />
                </div>
                
                <div className="p-6 pt-12">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {product.website}
                    </span>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.availability ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {product.availability ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>
                  
                  <div className="mb-4 flex h-40 items-center justify-center bg-transparent p-0">
                    {product.image_url ? (
                      <div className="product-image-container w-full h-full">
                        <img src={product.image_url} alt={product.name} />
                      </div>
                    ) : (
                      <div className="product-image-container w-full h-full bg-gray-50 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{product.source || 'Product'}</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      4.7
                    </div>
                  </div>
                  
                  <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-indigo-600 transition-colors">
                    {product.name || product.url}
                  </h3>
                  
                  <div className="mb-2">
                    <PriceDisplay 
                      currentPrice={product.current_price} 
                      previousPrice={product.previous_price} 
                      currency={product.currency} 
                      size="md" 
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.availability ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      ● {product.availability ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <span className="block font-medium text-gray-400">Last checked</span>
                      {formatRelativeTime(product.last_checked_at)}
                    </div>
                    <div className="text-right">
                      <span className="block font-medium text-gray-400">Next check</span>
                      {formatRelativeTime(product.next_check_at)}
                    </div>
                  </div>
                </div>
                
                {isPriceDrop ? (
                  <div className="bg-green-500 px-6 py-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 font-medium">
                      <TrendingDown className="h-4 w-4" />
                      Target reached!
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <span className="text-sm font-medium">View details</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
