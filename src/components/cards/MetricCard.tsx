'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  change?: number | null;
  changeLabel?: string;
  date?: string;
  description?: string;
  signal?: 'positive' | 'negative' | 'neutral' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

function getSignalColor(signal?: string) {
  switch (signal) {
    case 'positive': return 'text-emerald-400';
    case 'negative': return 'text-red-400';
    case 'warning': return 'text-amber-400';
    default: return 'text-slate-400';
  }
}

function formatValue(value: string | number | null, unit?: string): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  const formatted = Math.abs(num) < 10 ? num.toFixed(2) : num.toFixed(1);
  return unit ? `${formatted}${unit}` : formatted;
}

export default function MetricCard({
  label,
  value,
  unit,
  change,
  changeLabel,
  date,
  description,
  signal,
  size = 'md',
}: MetricCardProps) {
  const isPositiveChange = change !== null && change !== undefined && change > 0;
  const isNegativeChange = change !== null && change !== undefined && change < 0;
  const signalColor = getSignalColor(signal);

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[size];

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`bg-slate-800/60 border border-slate-700/50 rounded-xl ${sizeClasses} hover:border-slate-600/50 transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide leading-tight">
          {label}
        </span>
        {signal && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            signal === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
            signal === 'negative' ? 'bg-red-500/10 text-red-400' :
            signal === 'warning' ? 'bg-amber-500/10 text-amber-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {signal === 'positive' ? '利多' : signal === 'negative' ? '利空' : signal === 'warning' ? '注意' : '中性'}
          </span>
        )}
      </div>

      <div className={`mt-1.5 font-bold ${valueSizes} ${signalColor} tabular-nums`}>
        {formatValue(value, unit)}
      </div>

      {(change !== null && change !== undefined) && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${
          isPositiveChange ? 'text-emerald-400' : isNegativeChange ? 'text-red-400' : 'text-slate-400'
        }`}>
          {isPositiveChange ? <TrendingUp size={12} /> : isNegativeChange ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>
            {change > 0 ? '+' : ''}{change.toFixed(2)}
            {changeLabel && ` ${changeLabel}`}
          </span>
        </div>
      )}

      {description && (
        <div className="mt-1.5 text-xs text-slate-500 leading-tight">{description}</div>
      )}

      {date && (
        <div className="mt-2 text-xs text-slate-600">{date}</div>
      )}
    </div>
  );
}
