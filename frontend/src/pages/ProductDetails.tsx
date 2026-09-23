import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';
import { ArrowLeft, RefreshCw, Pause, Play, Trash2, ExternalLink, Activity, Target, TrendingDown, Info, Save, Bell } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import PriceDisplay from '../components/PriceDisplay';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  
  // Alert settings state
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [checkInterval, setCheckInterval] = useState<number>(60);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = () => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setTargetPrice(res.data.target_price ? res.data.target_price.toString() : '');
        setCheckInterval(res.data.check_interval || 60);
        setEmailEnabled(res.data.email_enabled !== undefined ? res.data.email_enabled : true);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        navigate('/products');
      });
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setError('');
    try {
      await api.post(`/products/${id}/check-price`);
      fetchProduct();
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to check price');
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to stop tracking this product?')) {
      try {
        await api.delete(`/products/${id}`);
        navigate('/products');
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  const toggleTracking = async () => {
    try {
      await api.put(`/products/${id}`, { is_active: !product.is_active });
      setProduct({ ...product, is_active: !product.is_active });
    } catch (error) {
      console.error(error);
    }
  };

  const saveAlertSettings = async () => {
    setSavingSettings(true);
    setSettingsSuccess('');
    setError('');
    
    try {
      await api.put(`/products/${id}/alert-settings`, {
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        check_interval: checkInterval,
        email_enabled: emailEnabled
      });
      
      setSettingsSuccess('Alert settings saved successfully.');
      setTimeout(() => setSettingsSuccess(''), 3000);
      fetchProduct();
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
      </div>
    );
  }

  // Format data for Recharts AreaChart
  const chartData = product.price_history.map((h: any) => ({
    date: new Date(h.checked_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    price: h.price
  }));

  const prices = product.price_history.map((h:any) => h.price);
  const lowest = prices.length ? Math.min(...prices) : product.current_price;
  const isTargetReached = product.target_price && product.current_price <= product.target_price;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="flex w-fit items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleCheckNow} 
            disabled={checking}
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Price'}
          </button>
          
          <button 
            onClick={toggleTracking}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              product.is_active 
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500' 
                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-500'
            }`}
          >
            {product.is_active ? (
              <><Pause className="h-4 w-4" /> Pause Tracking</>
            ) : (
              <><Play className="h-4 w-4" /> Resume Tracking</>
            )}
          </button>
          
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start shadow-sm">
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Product Info */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {product.website}
              </span>
              <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.availability ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {product.availability ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>
            
            <div className="mb-6 flex h-64 w-full items-center justify-center bg-transparent p-0">
              {product.image_url ? (
                <div className="product-image-container w-full h-full">
                  <img src={product.image_url} alt={product.name} />
                </div>
              ) : (
                <div className="product-image-container w-full h-full bg-gray-50 flex items-center justify-center">
                  <Activity className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>
            
            <h2 className="mb-3 text-xl font-bold text-gray-900 leading-tight">
              {product.name || 'Unknown Product'}
            </h2>
            
            <a 
              href={product.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline mb-6"
            >
              View on {product.website} <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="rounded-xl bg-gray-50 p-5 border border-gray-100 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Current Price</p>
                <PriceDisplay 
                  currentPrice={product.current_price} 
                  previousPrice={product.previous_price} 
                  currency={product.currency} 
                  size="lg" 
                />
                {product.source_price && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/50 rounded-md p-1.5 border border-gray-200">
                    <Info className="h-3.5 w-3.5" />
                    <span>Source: <span className="font-semibold capitalize">{product.source}</span> | Original price: {formatCurrency(product.source_price, product.source_currency)}</span>
                  </div>
                )}
              </div>
              
              {isTargetReached && (
                <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
                  <Target className="h-4 w-4" />
                  Target reached!
                </div>
              )}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Lowest</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(lowest, product.currency)}</p>
            </div>
            
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Target className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Target</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {product.target_price ? formatCurrency(product.target_price, product.currency) : 'Not set'}
              </p>
            </div>
          </div>
          
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-indigo-600 px-5 py-4 text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-bold">Alert Settings</h3>
            </div>
            
            <div className="p-5 space-y-5">
              {settingsSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                  ✓ {settingsSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Frequency</label>
                <select 
                  value={checkInterval}
                  onChange={(e) => setCheckInterval(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={180}>3 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (₹)</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 border"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
                <div className="flex items-center">
                  <input
                    id="email-notif"
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="email-notif" className="ml-2 block text-sm text-gray-900">
                    Email
                  </label>
                </div>
              </div>
              
              <button
                onClick={saveAlertSettings}
                disabled={savingSettings}
                className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
              >
                {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="col-span-1 lg:col-span-2">
          <div className="h-full rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Price History</h3>
              <p className="text-sm text-gray-500 mt-1">Track how the price has changed over time.</p>
            </div>
            
            <div className="h-[400px] w-full mt-4">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dx={-10}
                      tickFormatter={(value) => formatCurrency(value, product.currency)}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatCurrency(value, product.currency), 'Price']}
                    />
                    {product.target_price && (
                      <ReferenceLine y={product.target_price} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target', fill: '#10b981', fontSize: 12 }} />
                    )}
                    <Area 
                      type="stepAfter" 
                      dataKey="price" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-gray-500">
                  <Activity className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="font-medium text-gray-900">Not enough data yet</p>
                  <p className="text-sm">We need at least two price checks to draw a chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
