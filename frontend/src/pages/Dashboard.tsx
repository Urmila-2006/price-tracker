import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, TrendingDown, Bell, ArrowRight, Activity, Plus, Flame, Sparkles, Check } from 'lucide-react';
import PriceDisplay from '../components/PriceDisplay';
import { formatCurrency } from '../utils/currency';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { count: totalProducts },
          { count: priceDrops },
          { count: targetAlerts },
          { data: recentProducts },
          { data: recentAlerts }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).lt('current_price', 'previous_price'),
          supabase.from('price_alerts').select('*', { count: 'exact', head: true }).eq('enabled', true), // approximation for alerts
          supabase.from('products').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        setStats({
          total_products: totalProducts || 0,
          price_drops: priceDrops || 0,
          target_alerts: targetAlerts || 0,
          recent_products: recentProducts || [],
          recent_alerts: recentAlerts || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm text-gray-500">Overview of your tracked products and alerts.</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              ● DEMO PRICE MODE
            </span>
          </div>
        </div>
        <Link 
          to="/products/add" 
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 opacity-50 transition-transform group-hover:scale-150"></div>
          <div className="relative flex items-center">
            <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Package size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tracked Products</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_products}</p>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-50 opacity-50 transition-transform group-hover:scale-150"></div>
          <div className="relative flex items-center">
            <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <TrendingDown size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Price Drops</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.price_drops}</p>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 opacity-50 transition-transform group-hover:scale-150"></div>
          <div className="relative flex items-center">
            <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Bell size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Target Alerts</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.target_alerts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Trending Deals Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" /> Trending Deals
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.recent_products
                .filter((p: any) => p.current_price && p.previous_price && p.current_price < p.previous_price)
                .sort((a: any, b: any) => {
                  const dropA = (a.previous_price - a.current_price) / a.previous_price;
                  const dropB = (b.previous_price - b.current_price) / b.previous_price;
                  return dropB - dropA;
                })
                .slice(0, 4)
                .map((p: any) => {
                  const discount = (((p.previous_price - p.current_price) / p.previous_price) * 100).toFixed(1);
                  return (
                    <Link key={`trending-${p.id}`} to={`/products/${p.id}`} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        {discount}% OFF
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name || p.url}</h4>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-lg font-bold text-indigo-900">{formatCurrency(p.current_price, p.currency)}</span>
                          <span className="text-xs font-medium text-gray-400 line-through">{formatCurrency(p.previous_price, p.currency)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              
              {stats.recent_products.filter((p: any) => p.current_price && p.previous_price && p.current_price < p.previous_price).length === 0 && (
                <div className="col-span-1 sm:col-span-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-500">
                  <p>Wait a few minutes in Demo Mode to see trending deals appear automatically.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recommended Products (Mock static) */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" /> Recommended For You
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/products/add" className="rounded-xl bg-white overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-center p-3 gap-4">
                <div className="h-20 w-20 bg-gray-50 rounded-lg p-2 flex items-center justify-center shrink-0">
                  <img src="https://cdn.dummyjson.com/product-images/1/thumbnail.jpg" alt="iPhone" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">Apple iPhone 9</h4>
                  <p className="text-xs text-gray-500">Smartphones</p>
                  <p className="mt-1 text-sm font-bold text-indigo-900">₹45,999</p>
                </div>
              </Link>
              <Link to="/products/add" className="rounded-xl bg-white overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-center p-3 gap-4">
                <div className="h-20 w-20 bg-gray-50 rounded-lg p-2 flex items-center justify-center shrink-0">
                  <img src="https://cdn.dummyjson.com/product-images/6/thumbnail.png" alt="MacBook" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">MacBook Pro</h4>
                  <p className="text-xs text-gray-500">Laptops</p>
                  <p className="mt-1 text-sm font-bold text-indigo-900">₹1,44,900</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Alerts */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" /> Recent Alerts
              </h3>
            </div>
            
            <div className="divide-y divide-gray-100 overflow-y-auto">
              {stats.recent_alerts && stats.recent_alerts.length > 0 ? (
                stats.recent_alerts.map((alert: any) => (
                  <div key={`alert-${alert.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-indigo-50 p-1.5 text-indigo-600 shrink-0">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{alert.product_name}</h4>
                        <p className="text-xs font-semibold text-green-600 mb-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-gray-400 line-through">{formatCurrency(alert.old_price, 'INR')}</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(alert.new_price, 'INR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-gray-400 uppercase">
                            {new Date(alert.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {alert.email_status === 'sent' && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1 py-0.5 text-[9px] font-bold text-indigo-700">
                              Email sent <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No alerts generated yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recently Tracked Products</h3>
          <Link to="/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {stats.recent_products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
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
          <div className="divide-y divide-gray-100">
            {stats.recent_products.map((p: any) => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.name || p.url}</h4>
                    <p className="text-sm text-gray-500">{p.website}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                  <PriceDisplay 
                    currentPrice={p.current_price} 
                    previousPrice={p.previous_price} 
                    currency={p.currency} 
                    size="sm" 
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
