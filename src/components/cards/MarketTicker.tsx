'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

interface MarketTickerProps {
  items: TickerItem[];
  title: string;
  flag?: string;
}

function formatPrice(price: number, currency = 'USD'): string {
  if (!price || isNaN(price)) return '—';
  if (price >= 10000) return price.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return price.toFixed(4);
}

export default function MarketTicker({ items, title, flag }: MarketTickerProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        {flag && <span>{flag}</span>}
        {title}
      </h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-slate-500 text-sm py-2">加载中...</div>
        ) : (
          items.map(item => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">{item.name}</span>
                <span className="text-xs text-slate-500">{item.symbol}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-100 tabular-nums">
                  {formatPrice(item.price, item.currency)}
                </span>
                <div className={`flex items-center gap-1 text-xs tabular-nums ${
                  item.changePercent > 0 ? 'text-emerald-400' :
                  item.changePercent < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {item.changePercent > 0 ? <TrendingUp size={10} /> : item.changePercent < 0 ? <TrendingDown size={10} /> : null}
                  {item.changePercent > 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
