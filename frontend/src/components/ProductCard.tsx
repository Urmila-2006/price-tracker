import React, { useState } from 'react';
import { Star, Bell, Loader2 } from 'lucide-react';

import { formatCurrency } from '../utils/currency';

interface ProductCardProps {
  product: {
    external_id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    discount: number;
    rating: number;
    stock: number;
    brand: string;
    category: string;
    image_url: string;
    images: string[];
    availability: boolean;
    source: string;
    url: string;
    source_price?: number;
    source_currency?: string;
  };
  onClick: () => Promise<void>;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [loading, setLoading] = useState(false);

  const handleTrackClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onClick();
    } finally {
      // The parent will navigate away if successful, so this may not even run, but good to reset just in case.
      setLoading(false);
    }
  };

  return (
    <div 
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100 relative"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
      
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6 flex items-center justify-center">
        {product.discount > 0 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-md shadow-rose-500/30">
            {product.discount}% OFF
          </div>
        )}
        <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-gray-500 shadow-sm border border-gray-100 uppercase tracking-wider flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span> {product.source}
        </div>
        <img 
          src={product.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
          alt={product.name} 
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            {product.category}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-current" />
            {product.rating}
          </div>
        </div>
        
        <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
          {product.name}
        </h3>
        
        <div className="mb-4">
          <div className="flex items-end gap-2">
            <div className="text-xl font-black text-gray-900">
              {formatCurrency(product.price, product.currency)}
            </div>
            {product.discount > 0 && (
              <div className="text-sm font-medium text-gray-400 line-through mb-0.5">
                {formatCurrency(product.price / (1 - product.discount / 100), product.currency)}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleTrackClick}
          disabled={loading}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Track Price
            </>
          )}
        </button>
      </div>
    </div>
  );
}
