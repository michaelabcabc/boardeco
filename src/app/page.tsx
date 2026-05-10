'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import MetricCard from '@/components/cards/MetricCard';
import MarketTicker from '@/components/cards/MarketTicker';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import SignalPanel from '@/components/sections/SignalPanel';

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
  '^IXIC': '纳斯达克',
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

  const allQuotes = [...(market?.us ?? []), ...(market?.cn ?? []), ...(market?.global ?? [])];
  const getQuote = (sym: string) => allQuotes.find(q => q.symbol === sym);
  const vix = getQuote('^VIX');
  const sp500 = getQuote('^GSPC');

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard label="联储基准利率" value={usMacro?.indicators.fedFundsRate?.value ?? null} unit="%" date={usMacro?.indicators.fedFundsRate?.date} signal={(usMacro?.indicators.fedFundsRate?.value ?? 0) > 5 ? 'negative' : 'warning'} description="Fed Funds Rate" size="sm" />
              <MetricCard label="美债10Y" value={usMacro?.indicators.treasury10y?.value ?? null} unit="%" date={usMacro?.indicators.treasury10y?.date} description="10-Year Yield" size="sm" />
              <MetricCard label="美债2Y" value={usMacro?.indicators.treasury2y?.value ?? null} unit="%" date={usMacro?.indicators.treasury2y?.date} description="2-Year Yield" size="sm" />
              <MetricCard label="收益率曲线" value={usMacro?.indicators.yieldSpread?.value ?? null} unit="%" signal={(usMacro?.indicators.yieldSpread?.value ?? 0) < 0 ? 'negative' : 'positive'} description="10Y - 2Y spread" size="sm" />
              <MetricCard label="VIX 恐慌指数" value={vix?.price ?? null} signal={(vix?.price ?? 20) > 25 ? 'warning' : 'positive'} description="CBOE Volatility Index" size="sm" />
              <MetricCard label="CPI 同比" value={usMacro?.indicators.cpiYoY?.value ?? null} unit="%" date={usMacro?.indicators.cpiYoY?.date} signal={(usMacro?.indicators.cpiYoY?.value ?? 0) > 3 ? 'negative' : 'positive'} description="Consumer Price Index YoY" size="sm" />
              <MetricCard label="核心CPI" value={usMacro?.indicators.cpiCore?.value ?? null} date={usMacro?.indicators.cpiCore?.date} description="Core CPI (index level)" size="sm" />
              <MetricCard label="核心PCE" value={usMacro?.indicators.pce?.value ?? null} date={usMacro?.indicators.pce?.date} description="Core PCE（Fed偏好指标）" size="sm" />
              <MetricCard label="失业率" value={usMacro?.indicators.unemployment?.value ?? null} unit="%" date={usMacro?.indicators.unemployment?.date} signal={(usMacro?.indicators.unemployment?.value ?? 0) < 4.5 ? 'positive' : 'negative'} description="Unemployment Rate" size="sm" />
              <MetricCard label="首申失业金" value={usMacro?.indicators.initialClaims?.value ?? null} date={usMacro?.indicators.initialClaims?.date} description="Initial Jobless Claims (千)" size="sm" />
              <MetricCard label="GDP 增速" value={usMacro?.indicators.gdpGrowth?.value ?? null} unit="%" date={usMacro?.indicators.gdpGrowth?.date} signal={(usMacro?.indicators.gdpGrowth?.value ?? 0) > 0 ? 'positive' : 'negative'} description="季环比年化" size="sm" />
              <MetricCard label="零售销售" value={usMacro?.indicators.retailSales?.value ?? null} date={usMacro?.indicators.retailSales?.date} description="Retail Sales (百万美元)" size="sm" />
              <MetricCard label="M2 货币供应" value={usMacro?.indicators.m2?.value ?? null} date={usMacro?.indicators.m2?.date} description="M2 Money Supply (十亿)" size="sm" />
              <MetricCard label="消费者信心" value={usMacro?.indicators.consumerSentiment?.value ?? null} date={usMacro?.indicators.consumerSentiment?.date} signal={(usMacro?.indicators.consumerSentiment?.value ?? 0) > 80 ? 'positive' : 'warning'} description="U of Michigan Sentiment" size="sm" />
              <MetricCard label="S&P 500" value={sp500?.price ?? null} change={sp500?.changePercent} changeLabel="%" signal={(sp500?.changePercent ?? 0) > 0 ? 'positive' : 'negative'} description="标普500指数" size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LineChart title="联储利率走势（近3年）" data={(usMacro?.history.fedFunds ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#f59e0b" height={200} />
              <BarChart title="GDP 季度增速" data={(usMacro?.history.gdp ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" height={200} />
              <LineChart title="CPI 通胀走势（近3年）" data={(usMacro?.history.cpi ?? []).map(d => ({ date: d.date, value: d.value }))} color="#ec4899" height={200} />
              <LineChart title="失业率走势（近3年）" data={(usMacro?.history.unemployment ?? []).map(d => ({ date: d.date, value: d.value }))} unit="%" color="#ef4444" height={200} referenceValue={4} />
            </div>
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
