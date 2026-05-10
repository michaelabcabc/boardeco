'use client';

import { useMemo, useState, useEffect } from 'react';

interface DCFInputs {
  symbol: string;
  fcf: number;             // current free cash flow ($)
  sharesOutstanding: number; // shares
  netDebt: number;         // total debt - total cash ($)
  currentPrice: number;
  defaultGrowth: number;   // 0.10 = 10%
}

const TERMINAL_GROWTH_DEFAULT = 0.025; // 2.5% (long-term GDP growth)
const DISCOUNT_RATE_DEFAULT = 0.09;     // 9% (rough WACC for typical US stock)
const FORECAST_YEARS = 10;

function fmt(v: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (!isFinite(v)) return '—';
  if (opts.compact) {
    const abs = Math.abs(v);
    if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  }
  return v.toFixed(opts.decimals ?? 2);
}

function Slider({
  label, value, onChange, min, max, step, unit, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-indigo-300 tabular-nums">{(value * 100).toFixed(1)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500"
      />
      {hint && <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{hint}</div>}
    </label>
  );
}

export default function DCFCalculator(props: DCFInputs) {
  const { symbol, fcf, sharesOutstanding, netDebt, currentPrice, defaultGrowth } = props;

  // Default near-term growth from analyst data, but cap to reasonable range
  const initialGrowth5y = Math.min(0.25, Math.max(-0.05, defaultGrowth || 0.08));
  const [growth5y, setGrowth5y] = useState(initialGrowth5y);
  const [growth10y, setGrowth10y] = useState(initialGrowth5y / 2); // taper later years
  const [terminalGrowth, setTerminalGrowth] = useState(TERMINAL_GROWTH_DEFAULT);
  const [discountRate, setDiscountRate] = useState(DISCOUNT_RATE_DEFAULT);

  // Reset growth when symbol changes
  useEffect(() => {
    setGrowth5y(Math.min(0.25, Math.max(-0.05, defaultGrowth || 0.08)));
    setGrowth10y(Math.min(0.15, Math.max(-0.05, (defaultGrowth || 0.08) / 2)));
    setTerminalGrowth(TERMINAL_GROWTH_DEFAULT);
    setDiscountRate(DISCOUNT_RATE_DEFAULT);
  }, [symbol, defaultGrowth]);

  const result = useMemo(() => {
    if (!fcf || !sharesOutstanding || sharesOutstanding <= 0 || discountRate <= terminalGrowth) {
      return null;
    }
    const projectedFCF: number[] = [];
    let prev = fcf;
    for (let y = 1; y <= FORECAST_YEARS; y++) {
      const g = y <= 5 ? growth5y : growth10y;
      prev = prev * (1 + g);
      projectedFCF.push(prev);
    }
    // Discount factor for each year
    const pvFCF: number[] = projectedFCF.map((cf, i) => cf / Math.pow(1 + discountRate, i + 1));
    const sumPVFCF = pvFCF.reduce((a, b) => a + b, 0);

    // Terminal value at year 10 (Gordon growth)
    const lastFCF = projectedFCF[FORECAST_YEARS - 1];
    const terminalValue = (lastFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
    const pvTerminal = terminalValue / Math.pow(1 + discountRate, FORECAST_YEARS);

    const enterpriseValue = sumPVFCF + pvTerminal;
    const equityValue = enterpriseValue - netDebt;
    const fairValuePerShare = equityValue / sharesOutstanding;

    const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

    return {
      projectedFCF, pvFCF, sumPVFCF,
      terminalValue, pvTerminal,
      enterpriseValue, equityValue, fairValuePerShare,
      upside,
      terminalShare: pvTerminal / enterpriseValue,
    };
  }, [fcf, sharesOutstanding, netDebt, currentPrice, growth5y, growth10y, terminalGrowth, discountRate]);

  const canCompute = fcf > 0 && sharesOutstanding > 0;
  const tone =
    !result ? 'neutral'
    : result.upside > 0.30 ? 'good'
    : result.upside > 0.10 ? 'good'
    : result.upside > -0.10 ? 'warn'
    : 'bad';

  const toneCls = {
    good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    warn: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    bad: 'text-red-400 bg-red-500/10 border-red-500/30',
    neutral: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
  };

  return (
    <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h4 className="text-sm font-bold text-slate-100">🧮 DCF 现金流折现估值</h4>
        <span className="text-[10px] text-slate-500">理论最严谨，但假设非常敏感</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        把公司未来 10 年自由现金流 + 永续价值折回今天，得到&ldquo;<strong className="text-slate-200">内在价值</strong>&rdquo;。
        滑动下面的假设条，看公允价值如何变化 — 这才是 DCF 真正的用法（敏感性测试），而不是相信任何一个&ldquo;答案&rdquo;。
      </p>

      {!canCompute && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          ⚠️ 此公司 FCF 或股本数据不可用，无法计算 DCF。常见原因：金融业（银行/保险）现金流定义不同，或公司亏损 / 早期阶段。
        </div>
      )}

      {/* Inputs grid */}
      {canCompute && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Slider
              label="① 前5年 FCF 增速"
              value={growth5y}
              onChange={setGrowth5y}
              min={-0.10} max={0.40} step={0.005} unit="%"
              hint={`默认值 ${(initialGrowth5y * 100).toFixed(1)}% 取自分析师营收增长预期；高增长公司可调高`}
            />
            <Slider
              label="② 第6-10年 FCF 增速"
              value={growth10y}
              onChange={setGrowth10y}
              min={-0.05} max={0.25} step={0.005} unit="%"
              hint="通常会衰减；增长稀缺，10 年内难以维持高增速"
            />
            <Slider
              label="③ 永续增长率"
              value={terminalGrowth}
              onChange={setTerminalGrowth}
              min={0} max={0.05} step={0.0025} unit="%"
              hint="不能高于长期 GDP 增速（约 2-3%），否则无穷大荒谬"
            />
            <Slider
              label="④ 折现率（WACC）"
              value={discountRate}
              onChange={setDiscountRate}
              min={0.04} max={0.20} step={0.0025} unit="%"
              hint="资本加权成本；典型大盘股 8-10%，高风险股 12%+"
            />
          </div>

          {/* Result */}
          {result && (
            <div className={`border rounded-xl p-4 ${toneCls[tone]} mb-4`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">DCF 公允价值 / 股</div>
                  <div className="text-2xl font-bold tabular-nums">
                    ${result.fairValuePerShare.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">当前价</div>
                  <div className="text-2xl font-bold tabular-nums text-slate-100">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/40">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-slate-400">安全边际 / 上行空间</div>
                  <div className="text-xl font-bold tabular-nums">
                    {result.upside >= 0 ? '+' : ''}{(result.upside * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {result.upside > 0.30
                    ? '😎 显著低估 — 但需检查是否假设过于乐观'
                    : result.upside > 0.10
                      ? '✅ 略低估 — 在合理假设下有上行空间'
                      : result.upside > -0.10
                        ? '⚖️ 接近公允 — 价格大致反映了估算的现金流'
                        : '⚠️ 显著高估 — 当前价格已反映非常乐观的预期'}
                </div>
              </div>
            </div>
          )}

          {/* Composition table */}
          {result && (
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-200 mb-2 select-none">
                📋 展开：内在价值的构成（10年现金流 + 终值）
              </summary>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 mt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/50 text-slate-500">
                        <th className="text-left py-1 pr-3">年份</th>
                        <th className="text-right py-1 px-2">预测 FCF</th>
                        <th className="text-right py-1 pl-2">现值（贴现）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.projectedFCF.map((cf, i) => (
                        <tr key={i} className="border-b border-slate-700/30">
                          <td className="py-1 pr-3 text-slate-400">第 {i + 1} 年</td>
                          <td className="py-1 px-2 text-right text-slate-300 tabular-nums">${fmt(cf, { compact: true })}</td>
                          <td className="py-1 pl-2 text-right text-slate-300 tabular-nums">${fmt(result.pvFCF[i], { compact: true })}</td>
                        </tr>
                      ))}
                      <tr className="border-b border-slate-700/30 bg-slate-700/20">
                        <td className="py-1.5 pr-3 text-slate-300 font-semibold">永续终值（10年后）</td>
                        <td className="py-1.5 px-2 text-right text-slate-400 tabular-nums">${fmt(result.terminalValue, { compact: true })}</td>
                        <td className="py-1.5 pl-2 text-right text-slate-200 font-semibold tabular-nums">${fmt(result.pvTerminal, { compact: true })}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 text-slate-300 font-semibold">企业价值（EV）</td>
                        <td colSpan={2} className="py-1.5 pl-2 text-right text-emerald-300 font-bold tabular-nums">
                          ${fmt(result.enterpriseValue, { compact: true })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-slate-400">– 净负债</td>
                        <td colSpan={2} className="py-1 pl-2 text-right text-slate-400 tabular-nums">
                          ${fmt(netDebt, { compact: true })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 text-slate-200 font-semibold">股权价值</td>
                        <td colSpan={2} className="py-1.5 pl-2 text-right text-slate-100 font-bold tabular-nums">
                          ${fmt(result.equityValue, { compact: true })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-slate-400">÷ 股本</td>
                        <td colSpan={2} className="py-1 pl-2 text-right text-slate-400 tabular-nums">
                          {fmt(sharesOutstanding, { compact: true })} 股
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                  注意：终值通常占 EV 的 <strong className="text-amber-300">{(result.terminalShare * 100).toFixed(0)}%</strong>（本案）。
                  这意味着 DCF 结果对永续增长率和折现率<strong className="text-amber-300">极度敏感</strong> —
                  把折现率从 9% 调到 10%，公允价值会跌 15-20%。所以 DCF 的核心用法是<strong className="text-slate-300">敏感性分析</strong>，
                  不是给出&ldquo;真值&rdquo;。
                </div>
              </div>
            </details>
          )}
        </>
      )}

      {/* Inputs summary */}
      <div className="mt-4 pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>FCF（TTM）<div className="text-slate-300 font-semibold tabular-nums">${fmt(fcf, { compact: true })}</div></div>
        <div>股本<div className="text-slate-300 font-semibold tabular-nums">{fmt(sharesOutstanding, { compact: true })}</div></div>
        <div>净负债<div className="text-slate-300 font-semibold tabular-nums">${fmt(netDebt, { compact: true })}</div></div>
        <div>当前价<div className="text-slate-300 font-semibold tabular-nums">${currentPrice.toFixed(2)}</div></div>
      </div>
    </div>
  );
}
