'use client';

interface MetricRowProps {
  label: string;
  value: string | null;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  tag?: string;
}

const toneCls: Record<NonNullable<MetricRowProps['tone']>, string> = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  bad: 'text-red-400 bg-red-500/10 border-red-500/20',
  neutral: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
};

export default function MetricRow({ label, value, hint, tone = 'neutral', tag }: MetricRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-800/40 last:border-0">
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-300">{label}</div>
        {hint && <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{hint}</div>}
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        {tag && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${toneCls[tone]}`}>{tag}</span>
        )}
        <span className="text-sm font-semibold text-slate-100 tabular-nums">{value ?? '—'}</span>
      </div>
    </div>
  );
}
