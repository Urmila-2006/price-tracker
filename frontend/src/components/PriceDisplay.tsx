import { TrendingDown, TrendingUp, Minus, Info } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface PriceDisplayProps {
  currentPrice: number | null | undefined;
  previousPrice: number | null | undefined;
  currency: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceDisplay({ currentPrice, previousPrice, currency, size = 'md' }: PriceDisplayProps) {
  if (!currentPrice) {
    return <span className="text-gray-400 font-medium">-</span>;
  }

  const currentFormatted = formatCurrency(currentPrice, currency);
  const sizeClasses = {
    sm: { price: 'text-lg font-bold', prevPrice: 'text-xs', label: 'text-xs' },
    md: { price: 'text-2xl font-extrabold', prevPrice: 'text-sm', label: 'text-sm' },
    lg: { price: 'text-4xl font-extrabold', prevPrice: 'text-base', label: 'text-sm' },
  };

  const classes = sizeClasses[size];

  // 4. NO PREVIOUS PRICE
  if (previousPrice === null || previousPrice === undefined) {
    return (
      <div className="flex flex-col">
        <span className={`${classes.price} text-indigo-900 tracking-tight`}>
          {currentFormatted}
        </span>
        <div className={`flex items-center gap-1 mt-1 text-gray-500 font-medium ${classes.label}`}>
          <Info className="h-3.5 w-3.5" /> First Price Check
        </div>
      </div>
    );
  }

  // 3. CURRENT PRICE = PREVIOUS PRICE
  if (currentPrice === previousPrice) {
    return (
      <div className="flex flex-col">
        <span className={`${classes.price} text-indigo-900 tracking-tight`}>
          {currentFormatted}
        </span>
        <div className={`flex items-center gap-1 mt-1 text-gray-500 font-medium ${classes.label}`}>
          <Minus className="h-3.5 w-3.5" /> No Price Change
        </div>
      </div>
    );
  }

  // 1. CURRENT PRICE < PREVIOUS PRICE
  if (currentPrice < previousPrice) {
    const dropPercentage = (((previousPrice - currentPrice) / previousPrice) * 100).toFixed(1);
    return (
      <div className="flex flex-col">
        <div className="flex items-end gap-3 flex-wrap">
          <span className={`${classes.price} text-indigo-900 tracking-tight`}>
            {currentFormatted}
          </span>
          <span className={`mb-1 font-medium text-gray-400 line-through ${classes.prevPrice}`}>
            {formatCurrency(previousPrice, currency)}
          </span>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-green-600 font-semibold ${classes.label}`}>
          <TrendingDown className="h-3.5 w-3.5" /> {dropPercentage}% Price Drop
        </div>
      </div>
    );
  }

  // 2. CURRENT PRICE > PREVIOUS PRICE
  return (
    <div className="flex flex-col">
      <span className={`${classes.price} text-indigo-900 tracking-tight`}>
        {currentFormatted}
      </span>
      <div className={`flex items-center gap-1 mt-1 text-amber-600 font-semibold ${classes.label}`}>
        <TrendingUp className="h-3.5 w-3.5" /> Price Increased
      </div>
    </div>
  );
}
