import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';
import { Search, Loader2, Link as LinkIcon, Image as ImageIcon, AlertCircle, Compass, Link2 } from 'lucide-react';
import DiscoverProducts from '../components/DiscoverProducts';
import { formatCurrency } from '../utils/currency';

interface ProductPreview {
  name: string;
  price: number;
  currency: string;
  image_url: string;
  availability: boolean;
  source: string;
}

export default function AddProduct() {
  const [activeTab, setActiveTab] = useState<'discover' | 'custom'>('discover');
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [checkInterval, setCheckInterval] = useState('3600');
  
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setAnalyzing(true);
    setError('');
    setPreview(null);
    
    try {
      const res = await api.post('/products/preview', { url });
      setPreview(res.data);
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to analyze product URL');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartTracking = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/products', {
        url,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        check_interval: parseInt(checkInterval),
        source: 'custom'
      });
      navigate(`/products/${res.data.id}`);
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-lg shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[22px] bg-white/95 backdrop-blur-xl p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-4xl shadow-inner">
              🛍️
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Add New Product
              </h2>
              <p className="mt-1 text-gray-500 font-medium">Discover products, compare prices and track deals.</p>
            </div>
          </div>
          
          <div className="flex shrink-0 rounded-2xl bg-gray-100/80 p-1.5 backdrop-blur-sm border border-gray-200/50">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                activeTab === 'discover' 
                  ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-100 scale-100' 
                  : 'text-gray-500 hover:text-indigo-600 hover:scale-105 scale-95'
              }`}
            >
              <Compass className="h-4 w-4" />
              Discover Products
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                activeTab === 'custom' 
                  ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-100 scale-100' 
                  : 'text-gray-500 hover:text-indigo-600 hover:scale-105 scale-95'
              }`}
            >
              <Link2 className="h-4 w-4" />
              Custom URL
            </button>
          </div>
        </div>
      </div>
      
      {activeTab === 'discover' ? (
        <DiscoverProducts />
      ) : (
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start shadow-sm">
              <AlertCircle className="mr-3 mt-0.5 h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error analyzing product</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
            {!preview ? (
              <div className="p-8">
                <form onSubmit={handleAnalyze}>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Paste Product URL</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        className="w-full rounded-xl border border-gray-300 py-3.5 pl-12 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="https://example.com/product/123"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        required
                        disabled={analyzing}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={analyzing || !url}
                      className="flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-70 transition-colors whitespace-nowrap shadow-md"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                </form>
                
                <div className="mt-12 text-center text-gray-400">
                  <Search className="mx-auto h-16 w-16 opacity-20 mb-4" />
                  <p className="text-sm">Paste a link above to fetch product details automatically.</p>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">Product Preview</h3>
                  <button 
                    onClick={() => setPreview(null)}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    Change URL
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="flex h-48 w-full md:w-48 shrink-0 items-center justify-center rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                    {preview.image_url ? (
                      <img src={preview.image_url} alt="Product" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow space-y-3">
                    <div className="inline-block rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                      {preview.source}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {preview.name || 'Unknown Product Name'}
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-extrabold text-indigo-700">
                        {preview.price ? formatCurrency(preview.price, preview.currency) : 'N/A'}
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-bold ${preview.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {preview.availability ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Target Price (Optional)</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm font-semibold">₹</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-12 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. 49.99"
                        value={targetPrice}
                        onChange={e => setTargetPrice(e.target.value)}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">We'll email you when the price drops below this.</p>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Check Interval</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={checkInterval}
                      onChange={e => setCheckInterval(e.target.value)}
                    >
                      <option value="900">Every 15 minutes</option>
                      <option value="1800">Every 30 minutes</option>
                      <option value="3600">Every 1 hour</option>
                      <option value="21600">Every 6 hours</option>
                      <option value="43200">Every 12 hours</option>
                      <option value="86400">Every 24 hours</option>
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">How often our bots should check this page.</p>
                  </div>
                </div>
    
                <button
                  onClick={handleStartTracking}
                  disabled={submitting}
                  className="group relative w-full flex justify-center rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving Product...
                    </>
                  ) : (
                    'Start Tracking Product'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
