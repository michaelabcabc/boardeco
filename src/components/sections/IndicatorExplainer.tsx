'use client';

import { ReactNode } from 'react';
import { BookOpen, TrendingUp, Link2 } from 'lucide-react';

interface ReadingLevel {
  range: string;
  meaning: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface IndicatorExplainerProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  /** "是什么" — plain-language definition */
  whatIsIt: string;
  /** "怎么看" — reading levels with thresholds */
  readingLevels: ReadingLevel[];
  /** "对美股的影响" — direct connection to US stocks */
  stockImpact: ReactNode;
  /** "联动" — which other indicators this affects or follows */
  relatedTo?: string;
  /** Highlight current value's interpretation */
  currentValue?: number | null;
  currentInterpretation?: string;
}

const toneClasses: Record<ReadingLevel['tone'], string> = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  bad: 'text-red-400 bg-red-500/10 border-red-500/20',
  neutral: 'text-slate-400 bg-slate-700/30 border-slate-600/30',
};

export default function IndicatorExplainer({
  emoji,
  title,
  subtitle,
  whatIsIt,
  readingLevels,
  stockImpact,
  relatedTo,
  currentValue,
  currentInterpretation,
}: IndicatorExplainerProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {currentValue !== null && currentValue !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500">当前</div>
            <div className="text-lg font-bold text-slate-100 tabular-nums">
              {currentValue.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {currentInterpretation && (
        <div className="text-xs text-slate-300 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 mb-3">
          📌 <span className="text-slate-400">当前解读：</span>{currentInterpretation}
        </div>
      )}

      {/* What is it */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
          <BookOpen size={12} />
          是什么
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{whatIsIt}</p>
      </div>

      {/* How to read it */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-indigo-400 mb-1.5">📊 怎么看</div>
        <div className="space-y-1">
          {readingLevels.map((lv, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded border tabular-nums font-mono ${toneClasses[lv.tone]}`}>
                {lv.range}
              </span>
              <span className="text-slate-400 leading-relaxed">{lv.meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock impact */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
          <TrendingUp size={12} />
          对美股的影响
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">{stockImpact}</div>
      </div>

      {/* Related */}
      {relatedTo && (
        <div className="pt-3 border-t border-slate-700/40">
          <div className="flex items-start gap-1.5 text-xs">
            <Link2 size={12} className="text-slate-500 mt-0.5 shrink-0" />
            <span className="text-slate-500">联动指标：</span>
            <span className="text-slate-400">{relatedTo}</span>
          </div>
        </div>
      )}
    </div>
  );
}
