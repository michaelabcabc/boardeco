// Beginner-friendly metric formatters and rule-based classifiers.

export function fmtMoney(v?: number, currency = 'USD'): string | null {
  if (v == null || isNaN(v)) return null;
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T ${currency}`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B ${currency}`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M ${currency}`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K ${currency}`;
  return `${sign}${abs.toFixed(2)} ${currency}`;
}

export function fmtPercent(v?: number, decimals = 2): string | null {
  if (v == null || isNaN(v)) return null;
  // Yahoo returns ratios as decimals (0.05 = 5%)
  return `${(v * 100).toFixed(decimals)}%`;
}

export function fmtRatio(v?: number, decimals = 2): string | null {
  if (v == null || isNaN(v)) return null;
  return v.toFixed(decimals);
}

export function fmtPrice(v?: number, currency = 'USD'): string | null {
  if (v == null || isNaN(v)) return null;
  return `${v.toFixed(2)} ${currency}`;
}

export function fmtCount(v?: number): string | null {
  if (v == null || isNaN(v)) return null;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

// Classifiers — return a tone + tag for each metric.
// Thresholds are deliberately rough; they reflect "common practitioner heuristics".

export interface Classification {
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  tag: string;
}

export function classifyPE(pe?: number): Classification {
  if (pe == null) return { tone: 'neutral', tag: '—' };
  if (pe < 0) return { tone: 'bad', tag: '亏损' };
  if (pe < 15) return { tone: 'good', tag: '便宜' };
  if (pe < 25) return { tone: 'good', tag: '合理' };
  if (pe < 40) return { tone: 'warn', tag: '偏贵' };
  return { tone: 'bad', tag: '高估' };
}

export function classifyPB(pb?: number): Classification {
  if (pb == null) return { tone: 'neutral', tag: '—' };
  if (pb < 1) return { tone: 'good', tag: '低于净资产' };
  if (pb < 3) return { tone: 'good', tag: '合理' };
  if (pb < 6) return { tone: 'warn', tag: '偏贵' };
  return { tone: 'bad', tag: '很贵' };
}

export function classifyPS(ps?: number): Classification {
  if (ps == null) return { tone: 'neutral', tag: '—' };
  if (ps < 2) return { tone: 'good', tag: '便宜' };
  if (ps < 6) return { tone: 'good', tag: '合理' };
  if (ps < 12) return { tone: 'warn', tag: '偏贵' };
  return { tone: 'bad', tag: '泡沫区' };
}

export function classifyPEG(peg?: number): Classification {
  if (peg == null) return { tone: 'neutral', tag: '—' };
  if (peg < 0) return { tone: 'warn', tag: '盈利下滑' };
  if (peg < 1) return { tone: 'good', tag: '低估' };
  if (peg < 2) return { tone: 'good', tag: '合理' };
  return { tone: 'warn', tag: '增长撑不起估值' };
}

export function classifyMargin(m?: number): Classification {
  if (m == null) return { tone: 'neutral', tag: '—' };
  if (m < 0) return { tone: 'bad', tag: '亏损' };
  if (m < 0.05) return { tone: 'warn', tag: '微利' };
  if (m < 0.15) return { tone: 'good', tag: '正常' };
  if (m < 0.25) return { tone: 'good', tag: '高利润' };
  return { tone: 'good', tag: '极高利润' };
}

export function classifyROE(roe?: number): Classification {
  if (roe == null) return { tone: 'neutral', tag: '—' };
  if (roe < 0) return { tone: 'bad', tag: '亏损' };
  if (roe < 0.08) return { tone: 'warn', tag: '偏低' };
  if (roe < 0.15) return { tone: 'good', tag: '健康' };
  if (roe < 0.30) return { tone: 'good', tag: '优秀' };
  return { tone: 'good', tag: '卓越' };
}

export function classifyDebtEquity(de?: number): Classification {
  if (de == null) return { tone: 'neutral', tag: '—' };
  // Yahoo de is often 0-300+ (percent style)
  const v = de > 5 ? de / 100 : de;
  if (v < 0.5) return { tone: 'good', tag: '低杠杆' };
  if (v < 1) return { tone: 'good', tag: '健康' };
  if (v < 2) return { tone: 'warn', tag: '偏高' };
  return { tone: 'bad', tag: '高杠杆' };
}

export function classifyCurrentRatio(cr?: number): Classification {
  if (cr == null) return { tone: 'neutral', tag: '—' };
  if (cr < 1) return { tone: 'bad', tag: '短期偿付承压' };
  if (cr < 1.5) return { tone: 'warn', tag: '勉强' };
  if (cr < 3) return { tone: 'good', tag: '健康' };
  return { tone: 'good', tag: '非常宽裕' };
}

export function classifyGrowth(g?: number): Classification {
  if (g == null) return { tone: 'neutral', tag: '—' };
  if (g < -0.05) return { tone: 'bad', tag: '萎缩' };
  if (g < 0.05) return { tone: 'warn', tag: '低增长' };
  if (g < 0.15) return { tone: 'good', tag: '稳健增长' };
  if (g < 0.30) return { tone: 'good', tag: '高增长' };
  return { tone: 'good', tag: '爆发' };
}

export function classifyTargetUpside(current?: number, target?: number): Classification {
  if (current == null || target == null || current === 0) return { tone: 'neutral', tag: '—' };
  const upside = (target - current) / current;
  if (upside > 0.20) return { tone: 'good', tag: `分析师看好 +${(upside * 100).toFixed(0)}%` };
  if (upside > 0.05) return { tone: 'good', tag: `小幅看好 +${(upside * 100).toFixed(0)}%` };
  if (upside > -0.05) return { tone: 'warn', tag: '已到目标位附近' };
  return { tone: 'bad', tag: `分析师看跌 ${(upside * 100).toFixed(0)}%` };
}

export function classifyRecommendation(key?: string): Classification {
  if (!key) return { tone: 'neutral', tag: '—' };
  const k = key.toLowerCase();
  if (k.includes('strong_buy') || k === 'strong buy') return { tone: 'good', tag: '强烈买入' };
  if (k.includes('buy')) return { tone: 'good', tag: '买入' };
  if (k.includes('hold')) return { tone: 'warn', tag: '持有' };
  if (k.includes('sell') && k.includes('strong')) return { tone: 'bad', tag: '强烈卖出' };
  if (k.includes('sell') || k.includes('underperform')) return { tone: 'bad', tag: '卖出' };
  return { tone: 'neutral', tag: key };
}
