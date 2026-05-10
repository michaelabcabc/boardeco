'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  LineChart as ReLineChart,
  Line,
  YAxis,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PricePoint {
  date: string;
  close: number;
}

type Range = '1y' | '5y';

interface IndexHoverCardProps {
  symbol: string;
  label: string;
  children: ReactNode;
}

// Module-level cache so re-hovers across mount/unmount stay instant.
const cache: Record<string, Record<Range, PricePoint[] | undefined>> = {};

function setCache(symbol: string, range: Range, data: PricePoint[]) {
  if (!cache[symbol]) cache[symbol] = { '1y': undefined, '5y': undefined };
  cache[symbol][range] = data;
}

async function loadHistory(symbol: string, range: Range): Promise<PricePoint[]> {
  const cached = cache[symbol]?.[range];
  if (cached) return cached;
  try {
    const res = await fetch(`/api/index-history?symbol=${encodeURIComponent(symbol)}&range=${range}`, {
      cache: 'force-cache',
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data: PricePoint[] = Array.isArray(json.data) ? json.data : [];
    setCache(symbol, range, data);
    return data;
  } catch {
    return [];
  }
}

function formatTooltipDate(d: string) {
  return d?.slice(0, 7) || d;
}

function compactNumber(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString('en', { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

export default function IndexHoverCard({ symbol, label, children }: IndexHoverCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>('1y');
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Load whenever the open state and selected range change.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const cached = cache[symbol]?.[range];
    if (cached) {
      setData(cached);
      return;
    }
    setLoading(true);
    loadHistory(symbol, range).then(d => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, range, symbol]);

  // Close on outside click (mobile / sticky popover)
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function handleEnter() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (open) return;
    openTimer.current = window.setTimeout(() => setOpen(true), 150);
  }

  function handleLeave() {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  }

  function handleClick() {
    setOpen(o => !o);
  }

  // Compute simple summary stats from data
  const first = data[0]?.close;
  const last = data[data.length - 1]?.close;
  const min = data.length ? Math.min(...data.map(d => d.close)) : null;
  const max = data.length ? Math.max(...data.map(d => d.close)) : null;
  const totalChangePct = first && last ? ((last - first) / first) * 100 : null;
  const isUp = (totalChangePct ?? 0) >= 0;
  const lineColor = isUp ? '#10b981' : '#ef4444';

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          className="absolute left-1/2 top-full mt-2 z-40 -translate-x-1/2 w-[320px] sm:w-[380px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45" />

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">{label}</span>
              <span className="text-xs text-slate-500">{symbol}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 rounded-md p-0.5">
              {(['1y', '5y'] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRange(r);
                  }}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    range === r ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r === '1y' ? '近1年' : '近5年'}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {totalChangePct !== null && (
            <div className="flex items-baseline gap-3 text-xs mb-2">
              <span className="text-slate-500">区间涨跌</span>
              <span className={`text-sm font-bold tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{totalChangePct.toFixed(2)}%
              </span>
              {min !== null && max !== null && (
                <span className="text-slate-500 ml-auto tabular-nums">
                  低 {compactNumber(min)} · 高 {compactNumber(max)}
                </span>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="h-[140px]">
            {loading && data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">加载中…</div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-600">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatTooltipDate}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(v: number) => compactNumber(v)}
                    width={42}
                  />
                  <Tooltip
                    content={({ active, payload, label: lbl }) => {
                      if (!active || !payload?.length) return null;
                      const v = payload[0].value as number;
                      return (
                        <div className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs shadow">
                          <div className="text-slate-400">{lbl}</div>
                          <div className="text-slate-100 font-semibold tabular-nums">{compactNumber(v)}</div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={lineColor}
                    strokeWidth={1.6}
                    dot={false}
                    activeDot={{ r: 3, fill: lineColor }}
                    isAnimationActive={false}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-[10px] text-slate-600 mt-1 text-center">数据：Yahoo Finance · 仅供参考</div>
        </div>
      )}
    </div>
  );
}
