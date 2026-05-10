'use client';

import {
  classifyPE, classifyPB, classifyPEG, classifyMargin, classifyROE,
  classifyDebtEquity, classifyCurrentRatio, classifyGrowth, classifyTargetUpside,
} from './format';

interface F {
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  pegRatio?: number;
  profitMargins?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  currentRatio?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  freeCashflow?: number;
  totalDebt?: number;
  totalCash?: number;
  price?: number;
  targetMeanPrice?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  beta?: number;
  dividendYield?: number;
}

interface Bullet {
  text: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

function buildHighlights(f: F): Bullet[] {
  const out: Bullet[] = [];

  // 1. Valuation
  const pe = classifyPE(f.trailingPE);
  if (pe.tag !== '—') {
    out.push({ text: `P/E ${f.trailingPE?.toFixed(1) ?? '—'} → ${pe.tag}`, tone: pe.tone });
  }
  if (f.pegRatio != null) {
    const peg = classifyPEG(f.pegRatio);
    out.push({ text: `PEG ${f.pegRatio.toFixed(2)} → ${peg.tag}`, tone: peg.tone });
  }
  if (f.priceToBook != null) {
    const pb = classifyPB(f.priceToBook);
    out.push({ text: `P/B ${f.priceToBook.toFixed(2)} → ${pb.tag}`, tone: pb.tone });
  }

  // 2. Profitability
  if (f.profitMargins != null) {
    const m = classifyMargin(f.profitMargins);
    out.push({ text: `净利润率 ${(f.profitMargins * 100).toFixed(1)}% → ${m.tag}`, tone: m.tone });
  }
  if (f.returnOnEquity != null) {
    const r = classifyROE(f.returnOnEquity);
    out.push({ text: `ROE ${(f.returnOnEquity * 100).toFixed(1)}% → ${r.tag}`, tone: r.tone });
  }

  // 3. Growth
  if (f.revenueGrowth != null) {
    const g = classifyGrowth(f.revenueGrowth);
    out.push({ text: `营收 YoY ${(f.revenueGrowth * 100).toFixed(1)}% → ${g.tag}`, tone: g.tone });
  }
  if (f.earningsGrowth != null) {
    const g = classifyGrowth(f.earningsGrowth);
    out.push({ text: `盈利 YoY ${(f.earningsGrowth * 100).toFixed(1)}% → ${g.tag}`, tone: g.tone });
  }

  // 4. Health
  if (f.debtToEquity != null) {
    const d = classifyDebtEquity(f.debtToEquity);
    out.push({ text: `负债/权益 ${f.debtToEquity.toFixed(2)} → ${d.tag}`, tone: d.tone });
  }
  if (f.currentRatio != null) {
    const c = classifyCurrentRatio(f.currentRatio);
    out.push({ text: `流动比率 ${f.currentRatio.toFixed(2)} → ${c.tag}`, tone: c.tone });
  }
  if ((f.totalCash ?? 0) > (f.totalDebt ?? 0) && f.totalCash != null) {
    out.push({ text: '现金 > 总负债：净现金状态，财务非常稳健', tone: 'good' });
  }

  // 5. Position vs 52-week range
  if (f.price != null && f.fiftyTwoWeekHigh != null && f.fiftyTwoWeekLow != null) {
    const range = f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow;
    if (range > 0) {
      const pos = (f.price - f.fiftyTwoWeekLow) / range;
      if (pos > 0.9) out.push({ text: `当前接近 52 周高点（${(pos * 100).toFixed(0)}%位置）—— 注意追高风险`, tone: 'warn' });
      else if (pos < 0.1) out.push({ text: `当前接近 52 周低点（${(pos * 100).toFixed(0)}%位置）—— 看是反转还是下跌中继`, tone: 'warn' });
    }
  }

  // 6. Analyst target
  if (f.price != null && f.targetMeanPrice != null) {
    const t = classifyTargetUpside(f.price, f.targetMeanPrice);
    out.push({ text: `分析师目标价 ${f.targetMeanPrice.toFixed(2)} → ${t.tag}`, tone: t.tone });
  }

  // 7. Beta
  if (f.beta != null) {
    if (f.beta > 1.5) out.push({ text: `Beta ${f.beta.toFixed(2)} —— 比大盘波动大很多，风险偏好需谨慎`, tone: 'warn' });
    else if (f.beta < 0.7) out.push({ text: `Beta ${f.beta.toFixed(2)} —— 防御性强，比大盘波动小`, tone: 'good' });
  }

  // 8. Dividend
  if (f.dividendYield != null && f.dividendYield > 0) {
    const dy = f.dividendYield * 100;
    if (dy > 4) out.push({ text: `股息率 ${dy.toFixed(2)}% —— 高股息，但需核查可持续性`, tone: 'good' });
    else if (dy > 1) out.push({ text: `股息率 ${dy.toFixed(2)}% —— 有稳定派息`, tone: 'good' });
  }

  // 9. FCF
  if (f.freeCashflow != null) {
    if (f.freeCashflow > 0) out.push({ text: `自由现金流为正 → 公司有"造血"能力`, tone: 'good' });
    else out.push({ text: `自由现金流为负 → 业务尚需外部融资`, tone: 'warn' });
  }

  return out;
}

export default function Diagnostic({ fundamentals }: { fundamentals: F }) {
  const bullets = buildHighlights(fundamentals);

  const toneCls = {
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-red-400',
    neutral: 'text-slate-400',
  };
  const dotCls = {
    good: 'bg-emerald-400',
    warn: 'bg-amber-400',
    bad: 'bg-red-400',
    neutral: 'bg-slate-500',
  };

  if (bullets.length === 0) {
    return (
      <div className="text-xs text-slate-500">数据不足，无法生成诊断。</div>
    );
  }

  return (
    <div className="space-y-1.5">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${dotCls[b.tone]}`} />
          <span className={toneCls[b.tone]}>{b.text}</span>
        </div>
      ))}
      <p className="mt-3 text-[10px] text-slate-600 italic border-t border-slate-700/40 pt-2">
        * 自动诊断基于通用估值/盈利/财务规则，仅作起点参考；行业差异巨大，例如银行业 P/B 标准与科技股不同。请结合行业特性和定性研究。
      </p>
    </div>
  );
}
