'use client';

import { ReactNode } from 'react';

interface ValuationMethodProps {
  emoji: string;
  name: string;
  formula: string;
  currentValue: string | null;
  tag?: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' };
  /** 1-line summary of what the metric tells you */
  oneLiner: string;
  /** When this metric is most useful */
  bestFor: string;
  /** When this metric misleads */
  pitfalls: string[];
  /** Optional: what the metric considers vs ignores (esp. for forward methods) */
  considers?: string[];
  ignores?: string[];
  /** Reading thresholds for context */
  thresholds: { range: string; meaning: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }[];
  /** Optional extra note */
  note?: ReactNode;
}

const toneCls = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  bad: 'text-red-400 bg-red-500/10 border-red-500/30',
  neutral: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
};

export default function ValuationMethod({
  emoji, name, formula, currentValue, tag, oneLiner,
  bestFor, pitfalls, considers, ignores, thresholds, note,
}: ValuationMethodProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{emoji}</span> {name}
          </h4>
          <code className="text-[11px] text-indigo-300 font-mono mt-1 block leading-tight">{formula}</code>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">当前</div>
          <div className="text-lg font-bold text-slate-100 tabular-nums">{currentValue ?? '—'}</div>
          {tag && (
            <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${toneCls[tag.tone]}`}>
              {tag.label}
            </span>
          )}
        </div>
      </div>

      {/* One-liner */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-800/40 border border-slate-700/30 rounded-lg p-2.5">
        💡 {oneLiner}
      </p>

      {/* Considers / Ignores (optional, for forward methods) */}
      {(considers || ignores) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {considers && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5">
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">✅ 考虑了什么</div>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside leading-snug">
                {considers.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          {ignores && (
            <div className="bg-red-500/5 border border-red-500/20 rounded p-2.5">
              <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">❌ 没考虑什么</div>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside leading-snug">
                {ignores.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Best for / Pitfalls */}
      <div className="space-y-2 mb-3">
        <div className="text-xs">
          <span className="text-emerald-400 font-semibold">📌 适合：</span>
          <span className="text-slate-400">{bestFor}</span>
        </div>
        <div className="text-xs">
          <span className="text-amber-400 font-semibold">⚠️ 局限：</span>
          <ul className="text-slate-400 list-disc list-inside ml-1 mt-0.5 space-y-0.5 leading-relaxed">
            {pitfalls.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </div>

      {/* Thresholds */}
      <div className="border-t border-slate-700/40 pt-3">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">读数参考</div>
        <div className="space-y-1">
          {thresholds.map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded border tabular-nums font-mono ${toneCls[t.tone]}`}>
                {t.range}
              </span>
              <span className="text-slate-400 leading-snug">{t.meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {note && (
        <div className="mt-3 pt-3 border-t border-slate-700/40 text-xs text-slate-400 leading-relaxed">
          {note}
        </div>
      )}
    </div>
  );
}
