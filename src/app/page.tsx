'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import MetricCard from '@/components/cards/MetricCard';
import MarketTicker from '@/components/cards/MarketTicker';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import SignalPanel from '@/components/sections/SignalPanel';
import IndicatorExplainer from '@/components/sections/IndicatorExplainer';
import MacroChain from '@/components/sections/MacroChain';
import SectorSensitivity from '@/components/sections/SectorSensitivity';
import CyclePhase from '@/components/sections/CyclePhase';
import IndexHoverCard from '@/components/cards/IndexHoverCard';

interface QuoteItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
}

interface MarketData {
  us: QuoteItem[];
  usSectors: QuoteItem[];
  cn: QuoteItem[];
  global: QuoteItem[];
  updatedAt: string;
}

interface IndicatorPoint {
  value: number;
  date: string;
}

interface UsMacroData {
  indicators: {
    fedFundsRate?: IndicatorPoint;
    treasury10y?: IndicatorPoint;
    treasury2y?: IndicatorPoint;
    yieldSpread?: IndicatorPoint;
    cpi?: IndicatorPoint;
    cpiCore?: IndicatorPoint;
    cpiYoY?: IndicatorPoint;
    pce?: IndicatorPoint;
    unemployment?: IndicatorPoint;
    gdpGrowth?: IndicatorPoint;
    m2?: IndicatorPoint;
    retailSales?: IndicatorPoint;
    initialClaims?: IndicatorPoint;
    consumerSentiment?: IndicatorPoint;
  };
  history: {
    fedFunds: Array<{ date: string; value: string }>;
    treasury10y: Array<{ date: string; value: string }>;
    cpi: Array<{ date: string; value: string }>;
    unemployment: Array<{ date: string; value: string }>;
    gdp: Array<{ date: string; value: string }>;
  };
  updatedAt: string;
}

interface CnMacroData {
  indicators: {
    gdpGrowth?: { date: string; value: number };
    inflation?: { date: string; value: number };
    unemployment?: { date: string; value: number };
    exports?: { date: string; value: number };
    imports?: { date: string; value: number };
    gdpTotal?: { date: string; value: number };
    broadMoney?: { date: string; value: number };
    usdcny?: { value: number; date: string };
  };
  history: {
    gdpGrowth: Array<{ date: string; value: number | null }>;
    inflation: Array<{ date: string; value: number | null }>;
    unemployment: Array<{ date: string; value: number | null }>;
    exports: Array<{ date: string; value: number | null }>;
    imports: Array<{ date: string; value: number | null }>;
    broadMoney: Array<{ date: string; value: number | null }>;
  };
  updatedAt: string;
}

const SYMBOL_DISPLAY: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': '纳斯达克综合',
  '^NDX': '纳斯达克100',
  '^DJI': '道琼斯',
  '^RUT': '罗素2000',
  '^VIX': 'VIX恐慌指数',
  '000001.SS': '上证指数',
  '399001.SZ': '深证成指',
  '000300.SS': '沪深300',
  '^HSI': '恒生指数',
  'GC=F': '黄金',
  'CL=F': 'WTI原油',
  'BZ=F': '布伦特原油',
  'HG=F': '铜',
  'USDCNY=X': '美元/人民币',
  'USDHKD=X': '美元/港币',
  'DX-Y.NYB': '美元指数',
  '^TNX': '美债10Y收益率',
  '^IRX': '美债13周收益率',
  XLK: '科技板块 (XLK)',
  XLF: '金融板块 (XLF)',
  XLE: '能源板块 (XLE)',
  XLV: '医疗板块 (XLV)',
  XLY: '可选消费 (XLY)',
  XLP: '必选消费 (XLP)',
  XLI: '工业板块 (XLI)',
  XLU: '公用事业 (XLU)',
  XLRE: '房地产 (XLRE)',
  XLB: '原材料 (XLB)',
  XLC: '通信服务 (XLC)',
  SMH: '半导体 (SMH)',
  TLT: '20年+长债 (TLT)',
  HYG: '高收益债 (HYG)',
};

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type TabKey = 'overview' | 'us' | 'cn' | 'global';

export default function Dashboard() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [usMacro, setUsMacro] = useState<UsMacroData | null>(null);
  const [cnMacro, setCnMacro] = useState<CnMacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [m, us, cn] = await Promise.all([
      fetchJSON<MarketData>('/api/market'),
      fetchJSON<UsMacroData>('/api/us-macro'),
      fetchJSON<CnMacroData>('/api/cn-macro'),
    ]);
    if (m) setMarket(m);
    if (us) setUsMacro(us);
    if (cn) setCnMacro(cn);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const allQuotes = [...(market?.us ?? []), ...(market?.usSectors ?? []), ...(market?.cn ?? []), ...(market?.global ?? [])];
  const getQuote = (sym: string) => allQuotes.find(q => q.symbol === sym);
  const vix = getQuote('^VIX');

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: '总览' },
    { key: 'us', label: '🇺🇸 美国' },
    { key: 'cn', label: '🇨🇳 中国' },
    { key: 'global', label: '🌐 全球市场' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Activity size={16} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">宏观经济看板</h1>
              <p className="text-xs text-slate-500">美国 · 中国 · 全球市场</p>
            </div>
          </div>

          {/* Quick market strip */}
          <div className="hidden xl:flex items-center gap-5 text-xs overflow-hidden">
            {['^GSPC', '^IXIC', '000001.SS', '^HSI', 'GC=F', 'CL=F', 'USDCNY=X'].map(sym => {
              const q = getQuote(sym);
              if (!q) return null;
              const price = q.price >= 1000
                ? q.price.toLocaleString('en', { maximumFractionDigits: 0 })
                : q.price.toFixed(2);
              return (
                <div key={sym} className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500">{SYMBOL_DISPLAY[sym] || sym}</span>
                  <span className="font-semibold text-slate-200 tabular-nums">{price}</span>
                  <span className={`tabular-nums ${q.changePercent > 0 ? 'text-emerald-400' : q.changePercent < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {q.changePercent > 0 ? '+' : ''}{q.changePercent?.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-600 hidden sm:block">
              {lastRefresh.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 更新
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-slate-800/50">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs px-4 py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <SignalPanel
                  fedRate={usMacro?.indicators.fedFundsRate?.value}
                  cpiYoY={usMacro?.indicators.cpiYoY?.value}
                  unemployment={usMacro?.indicators.unemployment?.value}
                  gdpGrowth={usMacro?.indicators.gdpGrowth?.value}
                  yieldSpread={usMacro?.indicators.yieldSpread?.value}
                  vix={vix?.price}
                  consumerSentiment={usMacro?.indicators.consumerSentiment?.value}
                />
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="联储基准利率" value={usMacro?.indicators.fedFundsRate?.value ?? null} unit="%" date={usMacro?.indicators.fedFundsRate?.date} signal={(usMacro?.indicators.fedFundsRate?.value ?? 0) > 5 ? 'negative' : 'warning'} description="Fed Funds Rate" />
                <MetricCard label="美债10Y收益率" value={usMacro?.indicators.treasury10y?.value ?? null} unit="%" date={usMacro?.indicators.treasury10y?.date} description="10-Year Treasury Yield" />
                <MetricCard label="收益率曲线" value={usMacro?.indicators.yieldSpread?.value ?? null} unit="%" signal={(usMacro?.indicators.yieldSpread?.value ?? 0) < 0 ? 'negative' : 'positive'} description="10Y - 2Y spread（倒挂=衰退风险）" />
                <MetricCard label="CPI 同比" value={usMacro?.indicators.cpiYoY?.value ?? null} unit="%" date={usMacro?.indicators.cpiYoY?.date} signal={(usMacro?.indicators.cpiYoY?.value ?? 0) > 4 ? 'negative' : (usMacro?.indicators.cpiYoY?.value ?? 0) > 2.5 ? 'warning' : 'positive'} description="美国消费者物价指数 YoY" />
                <MetricCard label="失业率" value={usMacro?.indicators.unemployment?.value ?? null} unit="%" date={usMacro?.indicators.unemployment?.date} signal={(usMacro?.indicators.unemployment?.value ?? 0) < 4.5 ? 'positive' : 'negative'} description="US Unemployment Rate" />
                <MetricCard label="GDP 增速" value={usMacro?.indicators.gdpGrowth?.value ?? null} unit="%" date={usMacro?.indicators.gdpGrowth?.date} signal={(usMacro?.indicators.gdpGrowth?.value ?? 0) > 0 ? 'positive' : 'negative'} description="季环比年化" />
                <MetricCard label="中国 GDP 增速" value={cnMacro?.indicators.gdpGrowth?.value ?? null} unit="%" date={cnMacro?.indicators.gdpGrowth?.date} signal={(cnMacro?.indicators.gdpGrowth?.value ?? 0) > 5 ? 'positive' : 'neutral'} description="年增速 (World Bank)" />
                <MetricCard label="中国通胀 CPI" value={cnMacro?.indicators.inflation?.value ?? null} unit="%" date={cnMacro?.indicators.inflation?.date} signal={(cnMacro?.indicators.inflation?.value ?? 0) > 3 ? 'negative' : 'neutral'} description="消费者物价指数 YoY" />
                <MetricCard label="美元/人民币" value={cnMacro?.indicators.usdcny?.value ?? null} description="USD/CNY 即期汇率" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MarketTicker title="美国股市" flag="🇺🇸" items={allQuotes.filter(q => ['^GSPC', '^IXIC', '^DJI', '^VIX'].includes(q.symbol)).map(q => ({ ...q, name: SYMBOL_DISPLAY[q.symbol] || q.name }))} />
              <MarketTicker title="中国/香港股市" flag="🇨🇳" items={(market?.cn ?? []).map(q => ({ ...q, name: SYMBOL_DISPLAY[q.symbol] || q.name }))} />
              <MarketTicker title="大宗商品" flag="🛢️" items={allQuotes.filter(q => ['GC=F', 'CL=F', 'BZ=F', 'HG=F'].includes(q.symbol)).map(q => ({ ...q, name: SYMBOL_DISPLAY[q.symbol] || q.name }))} />
              <MarketTicker title="外汇 & 美债" flag="💱" items={allQuotes.filter(q => ['USDCNY=X', 'DX-Y.NYB', '^TNX'].includes(q.symbol)).map(q => ({ ...q, name: SYMBOL_DISPLAY[q.symbol] || q.name }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LineChart title="联储利率走势（近3年）" data={(usMacro?.history.fedFunds ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#f59e0b" height={160} />
              <LineChart title="美债10Y收益率（近5年）" data={(usMacro?.history.treasury10y ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#6366f1" height={160} referenceValue={4} referenceLabel="4%" />
              <LineChart title="失业率走势（近3年）" data={(usMacro?.history.unemployment ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#ef4444" height={160} />
            </div>
          </>
        )}

        {/* ── US ── */}
        {activeTab === 'us' && (
          <>
            {/* Intro for beginners */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-lg">🇺🇸</div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white mb-1">美国宏观与美股 — 入门解读看板</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    本页面把最关键的几个美国宏观指标拆开讲清楚：<strong className="text-slate-200">是什么、怎么看、对美股有什么影响</strong>。
                    数据本身不是目的——理解它们之间的<strong className="text-indigo-300">传导链条</strong>，才能判断市场在定价什么。
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    💡 <strong>看的顺序建议：</strong> 先看顶部&ldquo;综合信号&rdquo; → 再看&ldquo;经济周期阶段&rdquo; →
                    然后从&ldquo;利率与货币政策&rdquo;开始一节一节往下读 → 最后看&ldquo;宏观传导链&rdquo;建立全局视角 → 用&ldquo;板块敏感性表&rdquo;决定如何配置。
                  </p>
                </div>
              </div>
            </div>

            {/* Top: Composite signal + Cycle phase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SignalPanel
                fedRate={usMacro?.indicators.fedFundsRate?.value}
                cpiYoY={usMacro?.indicators.cpiYoY?.value}
                unemployment={usMacro?.indicators.unemployment?.value}
                gdpGrowth={usMacro?.indicators.gdpGrowth?.value}
                yieldSpread={usMacro?.indicators.yieldSpread?.value}
                vix={vix?.price}
                consumerSentiment={usMacro?.indicators.consumerSentiment?.value}
              />
              <CyclePhase
                fedRate={usMacro?.indicators.fedFundsRate?.value}
                cpiYoY={usMacro?.indicators.cpiYoY?.value}
                unemployment={usMacro?.indicators.unemployment?.value}
                yieldSpread={usMacro?.indicators.yieldSpread?.value}
                gdpGrowth={usMacro?.indicators.gdpGrowth?.value}
              />
            </div>

            {/* US Equity Indices Snapshot */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-200">📈 美国主要股指</h2>
                <span className="text-xs text-slate-500">实时报价（约15分钟延迟）</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {['^GSPC', '^NDX', '^IXIC', '^DJI', '^RUT', '^VIX'].map(sym => {
                  const q = getQuote(sym);
                  const label = SYMBOL_DISPLAY[sym] || sym;
                  return (
                    <IndexHoverCard key={sym} symbol={sym} label={label}>
                      <MetricCard
                        label={label}
                        value={q?.price ?? null}
                        change={q?.changePercent}
                        changeLabel="%"
                        signal={sym === '^VIX'
                          ? ((q?.price ?? 20) > 25 ? 'warning' : (q?.price ?? 20) > 30 ? 'negative' : 'positive')
                          : ((q?.changePercent ?? 0) > 0 ? 'positive' : (q?.changePercent ?? 0) < 0 ? 'negative' : 'neutral')}
                        description={
                          sym === '^GSPC' ? '500大蓝筹 · 悬停看走势' :
                          sym === '^NDX' ? '纳斯达克100 · 悬停看走势' :
                          sym === '^IXIC' ? '纳斯达克综合 · 悬停看走势' :
                          sym === '^DJI' ? '30只工业蓝筹 · 悬停看走势' :
                          sym === '^RUT' ? '小盘股代表 · 悬停看走势' :
                          '波动率指数 · 悬停看走势'
                        }
                        size="sm"
                      />
                    </IndexHoverCard>
                  );
                })}
              </div>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <span className="text-slate-300 font-semibold">📚 看股指的小窍门：</span>
                <strong className="text-emerald-400">S&P 500</strong> 是观察整体市场的标尺；
                <strong className="text-emerald-400">纳斯达克100</strong> 集中了 AAPL/MSFT/NVDA 等科技巨头，
                <strong className="text-amber-400">对利率最敏感</strong>；
                <strong className="text-emerald-400">道琼斯</strong>偏老经济蓝筹；
                <strong className="text-emerald-400">罗素2000</strong>反映美国本土小盘股，
                <strong className="text-amber-400">对国内经济周期最敏感</strong>；
                <strong className="text-emerald-400">VIX</strong>越高市场越恐慌（&gt;30 通常是阶段性底部）。
              </div>
            </section>

            {/* Section 1: 利率与货币政策 */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-indigo-500 pl-3">
                <h2 className="text-base font-bold text-white">💰 ① 利率与货币政策</h2>
                <span className="text-xs text-slate-500">— 决定美股估值的&ldquo;地心引力&rdquo;</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard label="联储基准利率" value={usMacro?.indicators.fedFundsRate?.value ?? null} unit="%" date={usMacro?.indicators.fedFundsRate?.date} signal={(usMacro?.indicators.fedFundsRate?.value ?? 0) > 5 ? 'negative' : (usMacro?.indicators.fedFundsRate?.value ?? 0) > 3 ? 'warning' : 'positive'} description="Fed Funds Rate" size="sm" />
                <MetricCard label="美债 2Y" value={usMacro?.indicators.treasury2y?.value ?? null} unit="%" date={usMacro?.indicators.treasury2y?.date} description="对联储政策最敏感" size="sm" />
                <IndexHoverCard symbol="^TNX" label="美债 10Y 收益率">
                  <MetricCard label="美债 10Y" value={usMacro?.indicators.treasury10y?.value ?? null} unit="%" date={usMacro?.indicators.treasury10y?.date} description="股票折现率基准 · 悬停看走势" size="sm" />
                </IndexHoverCard>
                <MetricCard label="收益率曲线" value={usMacro?.indicators.yieldSpread?.value ?? null} unit="%" signal={(usMacro?.indicators.yieldSpread?.value ?? 0) < 0 ? 'negative' : (usMacro?.indicators.yieldSpread?.value ?? 0) < 0.5 ? 'warning' : 'positive'} description="10Y − 2Y" size="sm" />
                <MetricCard label="M2 货币供应" value={usMacro?.indicators.m2?.value ?? null} date={usMacro?.indicators.m2?.date} description="十亿美元，流动性指标" size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <IndicatorExplainer
                  emoji="🏦"
                  title="联邦基金利率（Fed Funds Rate）"
                  subtitle={'美股的"地心引力"——所有估值的锚'}
                  currentValue={usMacro?.indicators.fedFundsRate?.value}
                  currentInterpretation={
                    (usMacro?.indicators.fedFundsRate?.value ?? 0) > 5 ? '高利率周期，估值受压，需要降息预期来推动股市'
                    : (usMacro?.indicators.fedFundsRate?.value ?? 0) > 3 ? '中性利率区间'
                    : '低利率宽松环境，有利风险资产'
                  }
                  whatIsIt={'美联储设定的银行间隔夜拆借基准利率。它是整个金融体系所有利率的"源头"——按揭、信用卡、企业贷款利率都跟着它走。'}
                  readingLevels={[
                    { range: '> 5%', meaning: '高利率周期（如 2023-2024 年），抑制经济和估值', tone: 'bad' },
                    { range: '3% - 5%', meaning: '中性偏紧，关注降息时间窗口', tone: 'warn' },
                    { range: '1% - 3%', meaning: '相对宽松', tone: 'good' },
                    { range: '< 1%', meaning: '极度宽松（金融危机 / 疫情应对）', tone: 'good' },
                  ]}
                  stockImpact={
                    <ul className="list-disc list-inside space-y-1">
                      <li>利率↑ → 折现率↑ → 股票估值↓（<strong className="text-amber-300">高估值科技股首当其冲</strong>）</li>
                      <li>利率↓ → 资金成本下降 → 估值修复 + 风险偏好回升</li>
                      <li><strong className="text-emerald-300">&ldquo;降息预期&rdquo;比实际降息更早被定价</strong>（buy the rumor, sell the news）</li>
                    </ul>
                  }
                  relatedTo="CPI / PCE（决定加息节奏）→ 美债 2Y/10Y → 收益率曲线 → 估值"
                />

                <IndicatorExplainer
                  emoji="📉"
                  title="收益率曲线（10Y − 2Y 利差）"
                  subtitle={'历史最准的"衰退预警器"'}
                  currentValue={usMacro?.indicators.yieldSpread?.value}
                  currentInterpretation={
                    (usMacro?.indicators.yieldSpread?.value ?? 0) < 0 ? '处于倒挂状态，历史上是衰退前兆（但平均领先 12-18 个月）'
                    : (usMacro?.indicators.yieldSpread?.value ?? 0) < 0.5 ? '曲线偏平，需警惕周期末段'
                    : '曲线正常陡峭，无衰退信号'
                  }
                  whatIsIt={'10年期美债收益率减去2年期美债收益率。正常情况下长债利率高于短债（投资者要求更多补偿），所以利差为正；当短债利率反超长债（利差为负，称"倒挂"），意味着市场预期未来要降息，通常对应衰退预期。'}
                  readingLevels={[
                    { range: '> 1%', meaning: '曲线陡峭，经济扩张/复苏', tone: 'good' },
                    { range: '0% - 1%', meaning: '曲线平坦，周期偏后段', tone: 'warn' },
                    { range: '−0.5% - 0%', meaning: '轻度倒挂，衰退预警', tone: 'bad' },
                    { range: '< −0.5%', meaning: '深度倒挂（如 2022-2023）', tone: 'bad' },
                  ]}
                  stockImpact={
                    <ul className="list-disc list-inside space-y-1">
                      <li>过去 50 年，每次倒挂后 6-18 个月都出现衰退（仅 1 次例外）</li>
                      <li><strong className="text-amber-300">&ldquo;倒挂解除&rdquo;反而是更危险的信号</strong>——衰退正在到来</li>
                      <li>金融板块（XLF）的盈利依赖陡峭曲线，倒挂期表现最差</li>
                    </ul>
                  }
                  relatedTo="2Y 跟随联储政策，10Y 反映长期增长预期 → 收益率曲线 → 经济周期判断"
                />
              </div>
            </section>

            {/* Section 2: 通胀 */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-pink-500 pl-3">
                <h2 className="text-base font-bold text-white">🔥 ② 通胀</h2>
                <span className="text-xs text-slate-500">— 决定联储能否降息的&ldquo;开关&rdquo;</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard label="CPI 同比" value={usMacro?.indicators.cpiYoY?.value ?? null} unit="%" date={usMacro?.indicators.cpiYoY?.date} signal={(usMacro?.indicators.cpiYoY?.value ?? 0) > 4 ? 'negative' : (usMacro?.indicators.cpiYoY?.value ?? 0) > 2.5 ? 'warning' : 'positive'} description="消费者物价指数 YoY" size="sm" />
                <MetricCard label="核心 CPI 指数" value={usMacro?.indicators.cpiCore?.value ?? null} date={usMacro?.indicators.cpiCore?.date} description="剔除食品能源（指数级）" size="sm" />
                <MetricCard label="核心 PCE 指数" value={usMacro?.indicators.pce?.value ?? null} date={usMacro?.indicators.pce?.date} description="联储最看重的指标" size="sm" />
                <MetricCard label="2% 联储目标" value={2} unit="%" signal="positive" description="基准参考" size="sm" />
              </div>

              <IndicatorExplainer
                emoji="🌡️"
                title="CPI 同比（消费者物价指数）& 核心 PCE"
                subtitle="联储 2% 目标盯的就是核心 PCE"
                currentValue={usMacro?.indicators.cpiYoY?.value}
                currentInterpretation={
                  (usMacro?.indicators.cpiYoY?.value ?? 0) > 4 ? '通胀偏高，联储难以降息——对股市是压制因素'
                  : (usMacro?.indicators.cpiYoY?.value ?? 0) > 2.5 ? '通胀在目标上方，联储观望'
                  : (usMacro?.indicators.cpiYoY?.value ?? 0) > 1.5 ? '通胀接近目标，宽松预期升温'
                  : '通胀偏低，存在通缩风险'
                }
                whatIsIt={'CPI 衡量普通家庭一篮子商品/服务的价格变化。"核心"指剔除食品和能源（这两项波动太大）。PCE 是另一种通胀指标，覆盖更广，是联储官方目标使用的版本。'}
                readingLevels={[
                  { range: '> 4%', meaning: '高通胀，联储倾向继续加息', tone: 'bad' },
                  { range: '2.5% - 4%', meaning: '在目标上方，需要时间回落', tone: 'warn' },
                  { range: '2% - 2.5%', meaning: '接近联储目标，理想区间', tone: 'good' },
                  { range: '< 2%', meaning: '通胀疲弱，可能引发通缩担忧', tone: 'warn' },
                ]}
                stockImpact={
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-amber-300">市场最爱看&ldquo;通胀低于预期&rdquo;</strong>，因为意味着联储可以更早降息</li>
                    <li>高通胀对成长股（科技）压力最大；对能源、原材料、银行相对友好</li>
                    <li>每月 CPI 数据日是美股最大的波动事件之一，盘前 5:30 PM PT 公布</li>
                    <li><strong className="text-emerald-300">通胀粘性 = 高利率持续</strong>——尤其是工资增速、服务通胀（粘性最强）</li>
                  </ul>
                }
                relatedTo="工资增速 → 服务通胀 → 核心 PCE → 联储利率决策 → 美股折现率"
              />
            </section>

            {/* Section 3: 就业 */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-emerald-500 pl-3">
                <h2 className="text-base font-bold text-white">💼 ③ 就业市场</h2>
                <span className="text-xs text-slate-500">— 经济温度计 + 美股的&ldquo;双刃剑&rdquo;</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard label="失业率" value={usMacro?.indicators.unemployment?.value ?? null} unit="%" date={usMacro?.indicators.unemployment?.date} signal={(usMacro?.indicators.unemployment?.value ?? 0) < 4 ? 'positive' : (usMacro?.indicators.unemployment?.value ?? 0) < 5 ? 'neutral' : 'warning'} description="月度，滞后指标" size="sm" />
                <MetricCard label="首申失业金" value={usMacro?.indicators.initialClaims?.value ?? null} date={usMacro?.indicators.initialClaims?.date} description="周度，领先指标" size="sm" />
                <MetricCard label="消费者信心" value={usMacro?.indicators.consumerSentiment?.value ?? null} date={usMacro?.indicators.consumerSentiment?.date} signal={(usMacro?.indicators.consumerSentiment?.value ?? 0) > 80 ? 'positive' : (usMacro?.indicators.consumerSentiment?.value ?? 0) > 60 ? 'warning' : 'negative'} description="密歇根大学" size="sm" />
              </div>

              <IndicatorExplainer
                emoji="👥"
                title="失业率 & 首次申请失业救济"
                subtitle={'"好消息=坏消息"的典型——就业太强反而吓到股市'}
                currentValue={usMacro?.indicators.unemployment?.value}
                currentInterpretation={
                  (usMacro?.indicators.unemployment?.value ?? 0) < 4 ? '充分就业，但要警惕工资压力使联储难以降息'
                  : (usMacro?.indicators.unemployment?.value ?? 0) < 5 ? '健康水平，对股市友好'
                  : (usMacro?.indicators.unemployment?.value ?? 0) < 6 ? '走升信号，警惕衰退临近'
                  : '就业市场恶化，衰退期'
                }
                whatIsIt={'失业率 = 失业人口 / 劳动力总数（月度，滞后）。首次申请失业救济（Initial Claims，周度，领先）是更高频的指标——拐点会比月度数据早 1-2 个月出现。'}
                readingLevels={[
                  { range: '< 4%', meaning: '充分就业（甚至过热）', tone: 'good' },
                  { range: '4% - 5%', meaning: '自然失业率附近，健康', tone: 'good' },
                  { range: '5% - 6%', meaning: '走升信号', tone: 'warn' },
                  { range: '> 6%', meaning: '经济疲弱', tone: 'bad' },
                ]}
                stockImpact={
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-amber-300">悖论：失业率太低反而是利空</strong>——劳动力市场紧张推升工资 → 服务通胀粘性 → 联储不能降息 → 估值受压</li>
                    <li>失业率快速上升（&ldquo;Sahm Rule&rdquo;：3个月均值比12个月低点高 0.5%）→ 经济进入衰退 → 股市下跌</li>
                    <li>首申失业金 &gt; 350K 持续多周 = 早期衰退信号</li>
                    <li>每月第一个周五的&ldquo;非农就业&rdquo;（NFP）是最大的就业事件，常引发盘前/盘中剧烈波动</li>
                  </ul>
                }
                relatedTo="非农就业 (NFP) · JOLTs 职位空缺 · 工资增速 → 通胀 → 联储决策 → 美股"
              />
            </section>

            {/* Section 4: 经济增长 */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-amber-500 pl-3">
                <h2 className="text-base font-bold text-white">🚀 ④ 经济增长与消费</h2>
                <span className="text-xs text-slate-500">— 决定企业盈利的&ldquo;分子&rdquo;</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard label="GDP 增速" value={usMacro?.indicators.gdpGrowth?.value ?? null} unit="%" date={usMacro?.indicators.gdpGrowth?.date} signal={(usMacro?.indicators.gdpGrowth?.value ?? 0) > 2 ? 'positive' : (usMacro?.indicators.gdpGrowth?.value ?? 0) > 0 ? 'warning' : 'negative'} description="季环比年化" size="sm" />
                <MetricCard label="零售销售" value={usMacro?.indicators.retailSales?.value ?? null} date={usMacro?.indicators.retailSales?.date} description="百万美元，环比看趋势" size="sm" />
              </div>

              <IndicatorExplainer
                emoji="📊"
                title="GDP 增速 & 零售销售"
                subtitle="股价 = 估值 × 盈利，GDP 决定盈利端"
                currentValue={usMacro?.indicators.gdpGrowth?.value}
                currentInterpretation={
                  (usMacro?.indicators.gdpGrowth?.value ?? 0) > 3 ? '强劲增长，企业盈利支撑'
                  : (usMacro?.indicators.gdpGrowth?.value ?? 0) > 1 ? '温和增长，平稳运行'
                  : (usMacro?.indicators.gdpGrowth?.value ?? 0) > 0 ? '增长放缓，关注转弱风险'
                  : '经济收缩，盈利下修'
                }
                whatIsIt={'GDP（季环比年化）是经济总产出的增速。美国消费支出占 GDP 约 70%，所以零售销售是重要的领先信号。零售强 → 企业盈利预期上修 → 股价受益。'}
                readingLevels={[
                  { range: '> 3%', meaning: '强劲增长，但可能引发加息预期', tone: 'good' },
                  { range: '1% - 3%', meaning: '健康增长，"金发姑娘"区间', tone: 'good' },
                  { range: '0% - 1%', meaning: '增长疲弱，注意转向', tone: 'warn' },
                  { range: '< 0%', meaning: '经济萎缩，连续两季 = 技术性衰退', tone: 'bad' },
                ]}
                stockImpact={
                  <ul className="list-disc list-inside space-y-1">
                    <li>长期看，<strong className="text-emerald-300">企业盈利和 GDP 同步增长</strong>，盈利驱动股价</li>
                    <li>短期注意&ldquo;过热&rdquo;陷阱：GDP 太强 → 通胀粘性 → 联储更鹰 → 利率上升 → 估值压缩</li>
                    <li>零售销售连续走弱 → 消费降温 → 企业盈利预期下调 → 可选消费板块 (XLY) 承压</li>
                  </ul>
                }
                relatedTo="零售销售 · ISM 制造业/服务业 PMI · 工业产出 → 企业盈利 (EPS) → 美股"
              />
            </section>

            {/* Macro chain visualization */}
            <MacroChain />

            {/* Sector ETFs */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-purple-500 pl-3">
                <h2 className="text-base font-bold text-white">🏭 美股板块 ETF（实时）</h2>
                <span className="text-xs text-slate-500">— 不同板块对宏观的反应不同</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {(market?.usSectors ?? []).map(q => (
                  <MetricCard
                    key={q.symbol}
                    label={SYMBOL_DISPLAY[q.symbol] || q.symbol}
                    value={q.price}
                    change={q.changePercent}
                    changeLabel="%"
                    signal={q.changePercent > 0 ? 'positive' : q.changePercent < 0 ? 'negative' : 'neutral'}
                    size="sm"
                  />
                ))}
              </div>

              <SectorSensitivity />
            </section>

            {/* Charts */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-2 border-l-4 border-cyan-500 pl-3">
                <h2 className="text-base font-bold text-white">📈 关键宏观指标历史走势</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LineChart title="联储利率走势（近3年）" data={(usMacro?.history.fedFunds ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#f59e0b" height={200} />
                <LineChart title="美债 10Y 收益率（近5年）" data={(usMacro?.history.treasury10y ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#6366f1" height={200} referenceValue={4} referenceLabel="4%" />
                <LineChart title="CPI 通胀走势（近3年）" data={(usMacro?.history.cpi ?? []).map(d => ({ date: d.date, value: d.value }))} color="#ec4899" height={200} />
                <LineChart title="失业率走势（近3年）" data={(usMacro?.history.unemployment ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#ef4444" height={200} referenceValue={4} referenceLabel="4%" />
                <BarChart title="GDP 季度增速" data={(usMacro?.history.gdp ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" height={200} />
              </div>
            </section>
          </>
        )}

        {/* ── CN ── */}
        {activeTab === 'cn' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard label="GDP 增速" value={cnMacro?.indicators.gdpGrowth?.value ?? null} unit="%" date={cnMacro?.indicators.gdpGrowth?.date} signal={(cnMacro?.indicators.gdpGrowth?.value ?? 0) > 5 ? 'positive' : 'neutral'} description="年增速 (World Bank)" size="sm" />
              <MetricCard label="CPI 通胀率" value={cnMacro?.indicators.inflation?.value ?? null} unit="%" date={cnMacro?.indicators.inflation?.date} signal={(cnMacro?.indicators.inflation?.value ?? 0) > 3 ? 'negative' : 'neutral'} description="消费者物价指数 YoY" size="sm" />
              <MetricCard label="失业率" value={cnMacro?.indicators.unemployment?.value ?? null} unit="%" date={cnMacro?.indicators.unemployment?.date} description="Unemployment Rate" size="sm" />
              <MetricCard label="出口 (% GDP)" value={cnMacro?.indicators.exports?.value ?? null} unit="%" date={cnMacro?.indicators.exports?.date} description="Exports % of GDP" size="sm" />
              <MetricCard label="进口 (% GDP)" value={cnMacro?.indicators.imports?.value ?? null} unit="%" date={cnMacro?.indicators.imports?.date} description="Imports % of GDP" size="sm" />
              <MetricCard label="广义货币 M2" value={cnMacro?.indicators.broadMoney?.value ?? null} unit="%" date={cnMacro?.indicators.broadMoney?.date} description="Broad Money % GDP" size="sm" />
              <MetricCard label="GDP 总量" value={cnMacro?.indicators.gdpTotal?.value ?? null} date={cnMacro?.indicators.gdpTotal?.date} description="GDP total (USD)" size="sm" />
              <MetricCard label="美元/人民币" value={cnMacro?.indicators.usdcny?.value ?? null} description="USD/CNY 即期汇率" size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(market?.cn ?? []).map(q => (
                <MetricCard key={q.symbol} label={SYMBOL_DISPLAY[q.symbol] || q.symbol} value={q.price} change={q.changePercent} changeLabel="%" signal={q.changePercent > 0 ? 'positive' : q.changePercent < 0 ? 'negative' : 'neutral'} description={q.symbol} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BarChart title="中国 GDP 增速（近10年）" data={(cnMacro?.history.gdpGrowth ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" height={200} />
              <LineChart title="中国通胀率（近10年）" data={(cnMacro?.history.inflation ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#f97316" height={200} referenceValue={3} referenceLabel="3%" />
              <LineChart title="出口占GDP比重" data={(cnMacro?.history.exports ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#22d3ee" height={200} />
              <LineChart title="广义货币 M2 (% GDP)" data={(cnMacro?.history.broadMoney ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#a78bfa" height={200} />
            </div>
          </>
        )}

        {/* ── GLOBAL ── */}
        {activeTab === 'global' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...(market?.global ?? []), ...(market?.us ?? []).filter(q => ['^TNX', '^VIX'].includes(q.symbol))].map(q => (
                <MetricCard key={q.symbol} label={SYMBOL_DISPLAY[q.symbol] || q.symbol} value={q.price} change={q.changePercent} changeLabel="%" signal={q.changePercent > 0 ? 'positive' : q.changePercent < 0 ? 'negative' : 'neutral'} description={q.symbol} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📖 关联解读指南</h3>
                <div className="space-y-3 text-xs text-slate-400">
                  <div><div className="text-slate-200 font-medium mb-1">黄金 & 美元指数</div><p>通常负相关。美元走强 → 黄金承压；美元走弱 → 黄金受益。黄金也是避险资产，市场动荡时上涨。</p></div>
                  <div><div className="text-slate-200 font-medium mb-1">原油 & 铜（铜博士）</div><p>铜对全球经济敏感度高，铜价上涨预示经济扩张；原油价格影响通胀预期和企业成本。</p></div>
                  <div><div className="text-slate-200 font-medium mb-1">美元/人民币</div><p>人民币贬值（USD/CNY升）通常对中国股市形成压力，但利于出口企业。</p></div>
                  <div><div className="text-slate-200 font-medium mb-1">VIX 恐慌指数</div><p>VIX &gt; 30 往往是市场恐慌底部，历史上是买点区域；VIX &lt; 15 市场过度乐观，需谨慎。</p></div>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 A股核心宏观驱动</h3>
                <div className="space-y-3 text-xs text-slate-400">
                  <div>
                    <div className="text-slate-200 font-medium mb-1">A股主要驱动</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>PBOC 货币政策（降准降息）</li>
                      <li>财政政策（专项债、刺激政策）</li>
                      <li>PMI 制造业景气度</li>
                      <li>外贸数据（出口导向型经济）</li>
                      <li>房地产市场走势（占GDP约15%）</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-slate-200 font-medium mb-1">港股主要驱动</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>美联储利率（港元联系汇率）</li>
                      <li>中概股监管政策风险</li>
                      <li>南向资金流向（陆港通）</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📅 重要数据发布日历</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { period: '每月第一个周五', event: '🇺🇸 非农就业 (NFP)', cls: 'text-amber-400' },
                    { period: '每月中旬', event: '🇺🇸 CPI 通胀数据', cls: 'text-amber-400' },
                    { period: '每季度末后', event: '🇺🇸 GDP 初值/修正值', cls: 'text-amber-400' },
                    { period: '每6-8周', event: '🇺🇸 FOMC 利率决议', cls: 'text-amber-400' },
                    { period: '每月1日', event: '🇨🇳 官方PMI 制造业/服务业', cls: 'text-red-400' },
                    { period: '每季末次月', event: '🇨🇳 GDP 季度数据', cls: 'text-red-400' },
                    { period: '每月中旬', event: '🇨🇳 CPI / PPI 数据', cls: 'text-red-400' },
                    { period: '每月13日前后', event: '🇨🇳 进出口贸易数据', cls: 'text-red-400' },
                  ].map(item => (
                    <div key={item.event} className="flex gap-2">
                      <span className="text-slate-600 shrink-0 w-24">{item.period}</span>
                      <span className={item.cls}>{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-700 py-4 border-t border-slate-800/50 mt-4">
          <p>数据来源：FRED (美联储) · Yahoo Finance · World Bank Open Data</p>
          <p className="mt-1">市场行情延迟约15分钟 · 宏观数据按月/季度更新 · 仅供参考，不构成投资建议</p>
        </footer>
      </main>
    </div>
  );
}
