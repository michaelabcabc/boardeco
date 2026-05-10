'use client';

import { useState, useCallback, FormEvent } from 'react';
import { Search, ExternalLink, RefreshCw } from 'lucide-react';
import LineChart from '@/components/charts/LineChart';
import MetricRow from './MetricRow';
import Diagnostic from './Diagnostic';
import {
  fmtMoney, fmtPercent, fmtRatio, fmtPrice, fmtCount,
  classifyPE, classifyPB, classifyPS, classifyPEG,
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
              输入美股代码（如 <code className="text-rose-300">AAPL</code> / <code className="text-rose-300">NVDA</code> / <code className="text-rose-300">BRK-B</code>），自动按
              <strong className="text-slate-200">公司画像 → 价格表现 → 估值 → 盈利能力 → 成长性 → 财务健康 → 分析师观点 → 自动诊断</strong>
              的结构生成解读，每个指标都附阈值说明。
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

      {/* Quick picks */}
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
      <h3 className="text-sm font-bold text-slate-100 mb-1">{title}</h3>
      {hint && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{hint}</p>}
      {!hint && <div className="mb-2" />}
      <div>{children}</div>
    </section>
  );
}

function StockReport({
  data,
  chartRange,
  setChartRange,
}: {
  data: StockResponse;
  chartRange: '1y' | '5y';
  setChartRange: (r: '1y' | '5y') => void;
}) {
  const f = data.fundamentals;
  const ccy = f.currency || 'USD';

  // Quick computed values
  const range52 = (f.price != null && f.fiftyTwoWeekHigh != null && f.fiftyTwoWeekLow != null)
    ? Math.max(0, Math.min(1, (f.price - f.fiftyTwoWeekLow) / (f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow)))
    : null;

  const peCls = classifyPE(f.trailingPE);
  const fpeCls = classifyPE(f.forwardPE);
  const pbCls = classifyPB(f.priceToBook);
  const psCls = classifyPS(f.priceToSalesTrailing12Months);
  const pegCls = classifyPEG(f.pegRatio);
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
              <a
                href={f.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
              >
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
          </div>
        </div>

        {f.longBusinessSummary && (
          <p className="text-xs text-slate-400 leading-relaxed mt-4 line-clamp-4">
            {f.longBusinessSummary}
          </p>
        )}
      </section>

      {/* Price chart + 52-week */}
      <section className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100">📈 价格走势</h3>
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-md p-0.5">
            {(['1y', '5y'] as const).map(r => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`text-xs px-2.5 py-0.5 rounded transition-colors ${
                  chartRange === r ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r === '1y' ? '近1年' : '近5年'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <LineChart
            title=""
            data={chartData}
            color="#6366f1"
            height={220}
            formatValue={(v: number) => v.toFixed(2)}
          />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">无价格数据</div>
        )}

        {/* 52-week range bar */}
        {range52 !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>52周低 {f.fiftyTwoWeekLow?.toFixed(2)}</span>
              <span className="text-slate-400">当前位置 {(range52 * 100).toFixed(0)}%</span>
              <span>52周高 {f.fiftyTwoWeekHigh?.toFixed(2)}</span>
            </div>
            <div className="relative h-2 bg-slate-800 rounded-full">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400 ring-2 ring-slate-900"
                style={{ left: `${range52 * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Two-column metric grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section
          title="💰 价格 & 市值"
          hint="看公司有多大、市场怎么定价、波动多大"
        >
          <MetricRow label="市值" value={fmtMoney(f.marketCap, '')} hint="公司全部股票的市场价值" />
          <MetricRow label="Beta（波动性）" value={fmtRatio(f.beta)} hint="相对 S&P 500 的波动倍数；>1.5 偏激进，<0.7 偏防御" />
          <MetricRow label="50日均价" value={fmtPrice(f.fiftyDayAverage, '')} hint="短期趋势参考线" />
          <MetricRow label="200日均价" value={fmtPrice(f.twoHundredDayAverage, '')} hint="长期趋势参考线" />
          <MetricRow label="EPS（TTM）" value={fmtRatio(f.trailingEps)} hint="过去12个月每股盈利" />
          <MetricRow label="EPS（前瞻）" value={fmtRatio(f.forwardEps)} hint="分析师未来12个月预期" />
        </Section>

        <Section
          title="📊 估值"
          hint="贵不贵？常用指标：股价 / 盈利、股价 / 净资产、股价 / 营收"
        >
          <MetricRow label="P/E（市盈率，TTM）" value={fmtRatio(f.trailingPE)} tone={peCls.tone} tag={peCls.tag} hint="股价 ÷ 每股盈利。<15 便宜、15-25 合理、>40 高估" />
          <MetricRow label="Forward P/E（前瞻）" value={fmtRatio(f.forwardPE)} tone={fpeCls.tone} tag={fpeCls.tag} hint="基于未来盈利预期；比 TTM 更看未来" />
          <MetricRow label="P/B（市净率）" value={fmtRatio(f.priceToBook)} tone={pbCls.tone} tag={pbCls.tag} hint="股价 ÷ 每股净资产。银行/保险常用" />
          <MetricRow label="P/S（市销率）" value={fmtRatio(f.priceToSalesTrailing12Months)} tone={psCls.tone} tag={psCls.tag} hint="股价 ÷ 每股营收。亏损/早期成长股用得多" />
          <MetricRow label="PEG（PE / 增长率）" value={fmtRatio(f.pegRatio)} tone={pegCls.tone} tag={pegCls.tag} hint="<1 增长能撑起估值；>2 增长跟不上估值" />
          <MetricRow label="EV / EBITDA" value={fmtRatio(f.enterpriseToEbitda)} hint="跨资本结构估值；常用 6-12 区间" />
        </Section>

        <Section
          title="💵 盈利能力"
          hint="赚钱效率：每 100 元营收能赚多少？资本回报率？"
        >
          <MetricRow label="营收（TTM）" value={fmtMoney(f.totalRevenue, '')} hint="过去12个月总收入" />
          <MetricRow label="EBITDA" value={fmtMoney(f.ebitda, '')} hint="息税折旧摊销前利润；衡量主业现金生成能力" />
          <MetricRow label="毛利率" value={fmtPercent(f.grossMargins)} tone={grossCls.tone} tag={grossCls.tag} hint="营收减直接成本后的比例；行业差异大" />
          <MetricRow label="经营利润率" value={fmtPercent(f.operatingMargins)} tone={opCls.tone} tag={opCls.tag} hint="日常经营赚钱效率" />
          <MetricRow label="净利润率" value={fmtPercent(f.profitMargins)} tone={profitCls.tone} tag={profitCls.tag} hint=">15% 算高利润，>25% 极高利润" />
          <MetricRow label="ROE（股东回报）" value={fmtPercent(f.returnOnEquity)} tone={roeCls.tone} tag={roeCls.tag} hint="净利润 ÷ 股东权益。15-30% 优秀" />
          <MetricRow label="ROA（资产回报）" value={fmtPercent(f.returnOnAssets)} tone={roaCls.tone} hint="净利润 ÷ 总资产。轻资产模式更高" />
        </Section>

        <Section
          title="🚀 成长性"
          hint="增速决定估值上限；同时关注盈利质量"
        >
          <MetricRow label="营收 YoY（最近季）" value={fmtPercent(f.revenueGrowth)} tone={revGrowthCls.tone} tag={revGrowthCls.tag} hint=">15% 高增长，>30% 爆发" />
          <MetricRow label="盈利 YoY" value={fmtPercent(f.earningsGrowth)} tone={epsGrowthCls.tone} tag={epsGrowthCls.tag} hint="净利润同比；与营收对比看是&ldquo;增收不增利&rdquo;" />
          <MetricRow label="EPS 季度增速" value={fmtPercent(f.earningsQuarterlyGrowth)} hint="环比近期，常用于趋势变化" />
          <MetricRow label="自由现金流" value={fmtMoney(f.freeCashflow, '')} hint="经营现金流 − 资本支出。为正才算&ldquo;真赚到钱&rdquo;" />
        </Section>

        <Section
          title="🛡️ 财务健康"
          hint="能不能扛过经济下行？现金、债务、流动比率"
        >
          <MetricRow label="现金及短投" value={fmtMoney(f.totalCash, '')} hint="账上的&ldquo;子弹&rdquo;" />
          <MetricRow label="总负债" value={fmtMoney(f.totalDebt, '')} hint="所有有息负债总和" />
          <MetricRow label="负债 / 权益" value={fmtRatio(f.debtToEquity)} tone={deCls.tone} tag={deCls.tag} hint="<50 低杠杆，>200 高杠杆" />
          <MetricRow label="流动比率" value={fmtRatio(f.currentRatio)} tone={crCls.tone} tag={crCls.tag} hint="流动资产 / 流动负债。>1.5 稳健" />
        </Section>

        <Section
          title="💎 股息 & 分析师"
          hint="分红回报 + 华尔街共识"
        >
          <MetricRow label="股息率" value={fmtPercent(f.dividendYield)} hint="年股息 / 股价；高股息股 >3%" />
          <MetricRow label="派息率" value={fmtPercent(f.payoutRatio)} hint=">80% 可能不可持续；50-70% 健康" />
          <MetricRow label="分析师评级" value={f.recommendationKey ?? null} tone={recCls.tone} tag={recCls.tag} hint="买入 / 持有 / 卖出 共识" />
          <MetricRow label="目标价（均值）" value={fmtPrice(f.targetMeanPrice, '')} tone={targetCls.tone} tag={targetCls.tag} hint="分析师未来12个月目标价" />
          <MetricRow label="目标价区间" value={
            f.targetLowPrice != null && f.targetHighPrice != null
              ? `${f.targetLowPrice.toFixed(2)} ~ ${f.targetHighPrice.toFixed(2)}`
              : null
          } hint="低估 / 高估边界" />
          <MetricRow label="覆盖分析师数" value={fmtCount(f.numberOfAnalystOpinions)} hint="覆盖越多，共识越可信" />
        </Section>
      </div>

      {/* Diagnostic */}
      <Section
        title="🩺 自动诊断（规则推断）"
        hint="把上面所有指标按通用阈值翻译成一句话评价"
      >
        <Diagnostic fundamentals={f} />
      </Section>

      {/* Beginner cheat sheet */}
      <Section title="📚 看个股的逻辑顺序（小白指引）">
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li><strong className="text-slate-200">先看商业模式</strong>：公司是做什么的？属于哪个行业？这决定了估值方法（科技股看 P/S/PEG，银行看 P/B，REIT 看 FFO 等）</li>
          <li><strong className="text-slate-200">再看护城河</strong>：高毛利 + 高 ROE 通常意味着有竞争壁垒（品牌、技术、网络效应、转换成本）</li>
          <li><strong className="text-slate-200">看成长性</strong>：营收/盈利同比增速 — 是加速还是减速？季度数据连续 2-3 季的趋势比单季更重要</li>
          <li><strong className="text-slate-200">看估值是否相称</strong>：高估值 + 高增长 = 合理；高估值 + 增长放缓 = 危险（PEG 看这个）</li>
          <li><strong className="text-slate-200">看财务健康</strong>：现金 vs 债务、流动比率、自由现金流是否为正 — 衰退期能不能扛住？</li>
          <li><strong className="text-slate-200">最后看分析师 & 价格位置</strong>：共识是参考，不是答案；52周位置帮你判断风险报酬比</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          本页只展示<strong className="text-slate-300">定量数据</strong>。完整研究还需要：年报 (10-K)、财报电话会议记录、行业竞争格局、管理层信誉等定性信息。
        </p>
      </Section>
    </div>
  );
}
