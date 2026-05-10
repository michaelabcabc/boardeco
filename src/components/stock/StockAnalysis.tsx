'use client';

import { useState, useCallback, FormEvent } from 'react';
import { Search, ExternalLink, RefreshCw } from 'lucide-react';
import LineChart from '@/components/charts/LineChart';
import MetricRow from './MetricRow';
import Diagnostic from './Diagnostic';
import AnalysisFramework from './AnalysisFramework';
import ValuationDeepDive from './ValuationDeepDive';
import DCFCalculator from './DCFCalculator';
import {
  fmtMoney, fmtPercent, fmtRatio, fmtPrice, fmtCount,
  classifyMargin, classifyROE, classifyDebtEquity, classifyCurrentRatio,
  classifyGrowth, classifyTargetUpside, classifyRecommendation,
} from './format';

interface Fundamentals {
  symbol: string;
  shortName?: string;
  longName?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  country?: string;
  website?: string;
  fullTimeEmployees?: number;
  longBusinessSummary?: string;
  price?: number;
  priceChangePct?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  priceToSalesTrailing12Months?: number;
  pegRatio?: number;
  enterpriseToEbitda?: number;
  totalRevenue?: number;
  ebitda?: number;
  profitMargins?: number;
  operatingMargins?: number;
  grossMargins?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  earningsQuarterlyGrowth?: number;
  totalCash?: number;
  totalDebt?: number;
  debtToEquity?: number;
  currentRatio?: number;
  freeCashflow?: number;
  dividendYield?: number;
  payoutRatio?: number;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  numberOfAnalystOpinions?: number;
  recommendationKey?: string;
  recommendationMean?: number;
  trailingEps?: number;
  forwardEps?: number;
  sharesOutstanding?: number;
  enterpriseValue?: number;
  bookValue?: number;
}

interface PricePoint { date: string; close: number }

interface StockResponse {
  symbol: string;
  fundamentals: Fundamentals;
  history: { '1y': PricePoint[]; '5y': PricePoint[] };
}

const POPULAR = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B', 'JPM', 'V', 'WMT', 'XOM'];

export default function StockAnalysis() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'1y' | '5y'>('1y');

  const search = useCallback(async (sym: string) => {
    const symbol = sym.trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error === 'invalid symbol'
          ? '股票代码格式不对（仅支持英文/数字/. - 字符）'
          : '抓取失败：股票可能不存在，或上游被限流，请稍后重试');
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(input);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-rose-500/5 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-lg">🔍</div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-1">美股个股分析 — 小白结构化看板</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              输入美股代码，按一套<strong className="text-slate-200">分析框架</strong>从商业质量到 DCF 内在价值逐步展开。
              重点在<strong className="text-rose-300">估值章节</strong> — 每种方法都解释了&ldquo;考虑了什么&rdquo;和&ldquo;没考虑什么&rdquo;，
              再加一个可调假设的 <strong className="text-rose-300">DCF 计算器</strong>。
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入美股代码（如 AAPL, NVDA, BRK-B）"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          分析
        </button>
      </form>

      {!data && !loading && (
        <div>
          <div className="text-xs text-slate-500 mb-2">热门标的：</div>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); search(s); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md px-3 py-1.5 text-slate-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
          ⚠️ {error}
        </div>
      )}

      {data && <StockReport data={data} chartRange={chartRange} setChartRange={setChartRange} />}
    </div>
  );
}

function Section({
  id, title, hint, children,
}: {
  id?: string; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 scroll-mt-20">
      <h3 className="text-sm font-bold text-slate-100 mb-1">{title}</h3>
      {hint && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{hint}</p>}
      {!hint && <div className="mb-2" />}
      <div>{children}</div>
    </section>
  );
}

function StockReport({
  data, chartRange, setChartRange,
}: {
  data: StockResponse;
  chartRange: '1y' | '5y';
  setChartRange: (r: '1y' | '5y') => void;
}) {
  const f = data.fundamentals;
  const ccy = f.currency || 'USD';

  const range52 = (f.price != null && f.fiftyTwoWeekHigh != null && f.fiftyTwoWeekLow != null && f.fiftyTwoWeekHigh > f.fiftyTwoWeekLow)
    ? Math.max(0, Math.min(1, (f.price - f.fiftyTwoWeekLow) / (f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow)))
    : null;

  const profitCls = classifyMargin(f.profitMargins);
  const opCls = classifyMargin(f.operatingMargins);
  const grossCls = classifyMargin(f.grossMargins);
  const roeCls = classifyROE(f.returnOnEquity);
  const roaCls = classifyROE(f.returnOnAssets);
  const revGrowthCls = classifyGrowth(f.revenueGrowth);
  const epsGrowthCls = classifyGrowth(f.earningsGrowth);
  const deCls = classifyDebtEquity(f.debtToEquity);
  const crCls = classifyCurrentRatio(f.currentRatio);
  const targetCls = classifyTargetUpside(f.price, f.targetMeanPrice);
  const recCls = classifyRecommendation(f.recommendationKey);

  const chartData = (data.history[chartRange] ?? []).map(p => ({ date: p.date, value: p.close }));

  const netDebt = (f.totalDebt ?? 0) - (f.totalCash ?? 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline flex-wrap gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{f.shortName || data.symbol}</h2>
              <span className="text-sm text-slate-500">{data.symbol}</span>
              {f.exchange && <span className="text-xs text-slate-600">· {f.exchange}</span>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
              {f.sector && <span><span className="text-slate-600">板块：</span>{f.sector}</span>}
              {f.industry && <span><span className="text-slate-600">行业：</span>{f.industry}</span>}
              {f.country && <span><span className="text-slate-600">国家：</span>{f.country}</span>}
              {f.fullTimeEmployees != null && <span><span className="text-slate-600">员工：</span>{f.fullTimeEmployees.toLocaleString()}</span>}
            </div>
            {f.website && (
              <a href={f.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2">
                {f.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-white tabular-nums">
              {f.price != null ? f.price.toFixed(2) : '—'}
              <span className="text-sm text-slate-500 font-normal ml-1">{ccy}</span>
            </div>
            {f.priceChangePct != null && (
              <div className={`text-sm font-medium tabular-nums ${f.priceChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {f.priceChangePct >= 0 ? '+' : ''}{f.priceChangePct.toFixed(2)}%
              </div>
            )}
            <div className="text-[10px] text-slate-500 mt-1">市值 {fmtMoney(f.marketCap, '') ?? '—'}</div>
          </div>
        </div>
        {f.longBusinessSummary && (
          <p className="text-xs text-slate-400 leading-relaxed mt-4 line-clamp-4">{f.longBusinessSummary}</p>
        )}
      </section>

      {/* Price chart */}
      <section className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100">📈 价格走势</h3>
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-md p-0.5">
            {(['1y', '5y'] as const).map(r => (
              <button key={r} onClick={() => setChartRange(r)}
                className={`text-xs px-2.5 py-0.5 rounded transition-colors ${
                  chartRange === r ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {r === '1y' ? '近1年' : '近5年'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <LineChart title="" data={chartData} color="#6366f1" height={220} formatValue={(v: number) => v.toFixed(2)} />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">无价格数据</div>
        )}
        {range52 !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>52周低 {f.fiftyTwoWeekLow?.toFixed(2)}</span>
              <span className="text-slate-400">当前位置 {(range52 * 100).toFixed(0)}%</span>
              <span>52周高 {f.fiftyTwoWeekHigh?.toFixed(2)}</span>
            </div>
            <div className="relative h-2 bg-slate-800 rounded-full">
              <div className="absolute top-1/2 w-3 h-3 rounded-full bg-indigo-400 ring-2 ring-slate-900"
                style={{ left: `${range52 * 100}%`, transform: 'translate(-50%, -50%)' }} />
            </div>
          </div>
        )}
      </section>

      {/* Framework map */}
      <AnalysisFramework />

      {/* ① 商业质量 */}
      <Section
        id="sec-quality"
        title="① 商业质量与护城河"
        hint="高毛利 + 高 ROE 是有竞争壁垒的标志（品牌、技术、网络效应、转换成本）。一家好生意能在竞争中保持高利润率，烂生意只能拼价格。"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <MetricRow label="毛利率（Gross Margin）" value={fmtPercent(f.grossMargins)} tone={grossCls.tone} tag={grossCls.tag} hint="营收减直接成本；行业差异大（软件 70%+，零售 20%）" />
          <MetricRow label="经营利润率" value={fmtPercent(f.operatingMargins)} tone={opCls.tone} tag={opCls.tag} hint="日常经营赚钱效率；剔除融资和税" />
          <MetricRow label="净利润率" value={fmtPercent(f.profitMargins)} tone={profitCls.tone} tag={profitCls.tag} hint="最终股东能拿到的比例" />
          <MetricRow label="ROE（股东回报率）" value={fmtPercent(f.returnOnEquity)} tone={roeCls.tone} tag={roeCls.tag} hint="净利润 ÷ 股东权益。15%+ 算优秀，长期看是质量第一指标" />
          <MetricRow label="ROA（资产回报率）" value={fmtPercent(f.returnOnAssets)} tone={roaCls.tone} hint="净利润 ÷ 总资产。轻资产模式天然更高" />
          <MetricRow label="营收（TTM）" value={fmtMoney(f.totalRevenue, '')} hint="过去12个月总收入" />
          <MetricRow label="EBITDA" value={fmtMoney(f.ebitda, '')} hint="主业现金生成能力（剔除税、利息、折旧）" />
        </div>
        <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-2.5 leading-relaxed">
          🔗 <span className="text-slate-300 font-semibold">连接下一节：</span>
          高质量的生意配合<strong>持续的成长</strong>才能创造长期回报。下面看：增速能不能保持？
        </div>
      </Section>

      {/* ② 成长性 */}
      <Section
        id="sec-growth"
        title="② 成长性"
        hint="增速决定估值上限。但要看&ldquo;质&rdquo; — 是高利润率自然增长，还是烧钱补贴换来的？自由现金流为正才算&ldquo;真赚到钱&rdquo;。"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <MetricRow label="营收 YoY（最近季）" value={fmtPercent(f.revenueGrowth)} tone={revGrowthCls.tone} tag={revGrowthCls.tag} hint="季度营收同比；>15% 高增长，>30% 爆发" />
          <MetricRow label="盈利 YoY" value={fmtPercent(f.earningsGrowth)} tone={epsGrowthCls.tone} tag={epsGrowthCls.tag} hint="净利润同比；与营收对比看是否&ldquo;增收不增利&rdquo;" />
          <MetricRow label="EPS 季度增速" value={fmtPercent(f.earningsQuarterlyGrowth)} hint="近期趋势加速 / 减速" />
          <MetricRow label="自由现金流" value={fmtMoney(f.freeCashflow, '')} hint="经营现金流 − 资本支出；为正才能给股东、再投资、还债" />
        </div>
        <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-2.5 leading-relaxed">
          🔗 <span className="text-slate-300 font-semibold">连接下一节：</span>
          就算生意好、增长快，<strong>衰退期能不能扛住</strong>？看资产负债表的现金 / 债务。
        </div>
      </Section>

      {/* ③ 财务健康 */}
      <Section
        id="sec-health"
        title="③ 财务健康"
        hint="经济下行时，杠杆高的公司先死。看：现金能撑多久？债务结构是否安全？流动性是否充足？"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <MetricRow label="现金及短投" value={fmtMoney(f.totalCash, '')} hint="账上的&ldquo;子弹&rdquo;" />
          <MetricRow label="总负债" value={fmtMoney(f.totalDebt, '')} hint="所有有息负债总和" />
          <MetricRow label="净负债（债务-现金）" value={fmtMoney(netDebt, '')} hint="负数表示净现金状态，财务非常稳健" />
          <MetricRow label="负债 / 权益" value={fmtRatio(f.debtToEquity)} tone={deCls.tone} tag={deCls.tag} hint="<50 低杠杆，>200 高杠杆" />
          <MetricRow label="流动比率" value={fmtRatio(f.currentRatio)} tone={crCls.tone} tag={crCls.tag} hint="流动资产 / 流动负债。>1.5 稳健，<1 短期偿付承压" />
        </div>
        <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-2.5 leading-relaxed">
          🔗 <span className="text-slate-300 font-semibold">连接下一节：</span>
          确认了是好生意 + 能扛住衰退后，最关键的问题来了：<strong>现在这个价格合理吗？</strong>
        </div>
      </Section>

      {/* ④ 估值（深入展开）*/}
      <Section
        id="sec-valuation"
        title="④ 估值（深入展开）"
        hint="本节是核心 — 6 种估值方法各自展开，逐个解释&ldquo;考虑了什么 / 没考虑什么&rdquo;，让你判断它们在<strong>这家具体公司</strong>上是否适用。"
      >
        <ValuationDeepDive f={f} />
      </Section>

      {/* ⑤ DCF */}
      <Section
        id="sec-dcf"
        title="⑤ DCF 内在价值估算"
        hint="所有估值方法里最&ldquo;基本面&rdquo;的：把公司未来现金流折现到今天。但假设非常敏感 — 重点是<strong>敏感性测试</strong>，不是相信一个&ldquo;答案&rdquo;。"
      >
        <DCFCalculator
          symbol={data.symbol}
          fcf={f.freeCashflow ?? 0}
          sharesOutstanding={f.sharesOutstanding ?? 0}
          netDebt={netDebt}
          currentPrice={f.price ?? 0}
          defaultGrowth={f.revenueGrowth ?? f.earningsGrowth ?? 0.08}
        />
      </Section>

      {/* Analyst */}
      <Section title="💎 分析师共识 & 股息">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <MetricRow label="分析师评级" value={f.recommendationKey ?? null} tone={recCls.tone} tag={recCls.tag} hint="买入 / 持有 / 卖出 共识" />
          <MetricRow label="覆盖分析师数" value={fmtCount(f.numberOfAnalystOpinions)} hint="覆盖越多，共识越可信" />
          <MetricRow label="目标价（均值）" value={fmtPrice(f.targetMeanPrice, '')} tone={targetCls.tone} tag={targetCls.tag} hint="未来12个月共识目标价" />
          <MetricRow label="目标价区间" value={
            f.targetLowPrice != null && f.targetHighPrice != null
              ? `${f.targetLowPrice.toFixed(2)} ~ ${f.targetHighPrice.toFixed(2)}`
              : null
          } hint="低估 / 高估边界" />
          <MetricRow label="股息率" value={fmtPercent(f.dividendYield)} hint="年股息 / 股价；高股息股 >3%" />
          <MetricRow label="派息率" value={fmtPercent(f.payoutRatio)} hint=">80% 不可持续；50-70% 健康" />
        </div>
        <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          💡 分析师共识有<strong className="text-amber-400">系统性乐观偏差</strong> — 历史上&ldquo;卖出&rdquo;评级极少。
          目标价是 12 个月预期，而不是公允价值。把它和 DCF 结果对比 — 如果两者差距大，说明分析师和你的假设差距大。
        </p>
      </Section>

      {/* Diagnostic */}
      <Section title="🩺 自动诊断（规则推断）" hint="把上面所有指标按通用阈值翻译成一段评价">
        <Diagnostic fundamentals={f} />
      </Section>
    </div>
  );
}
