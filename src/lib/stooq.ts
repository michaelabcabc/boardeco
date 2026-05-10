// Stooq.com - free stock data, no API key required, no rate limiting issues
// Works well from server-side environments
import { fetchCboeQuote } from './cboe';

export interface StooqQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  timestamp: number;
}

// CBOE serves real index values for US majors that Stooq has stopped exposing for free.
// Keys are Yahoo-format symbols; values are the CBOE delayed-quote slug.
// `divisor` is applied because CBOE's TNX series is 10× the actual 10Y yield.
const CBOE_OVERRIDES: Record<string, { cboe: string; divisor?: number }> = {
  '^GSPC': { cboe: '_SPX' },
  '^DJI':  { cboe: '_DJI' },
  '^NDX':  { cboe: '_NDX' },
  '^RUT':  { cboe: '_RUT' },
  '^VIX':  { cboe: '_VIX' },
  '^TNX':  { cboe: '_TNX', divisor: 10 },
};

// Stooq symbol mapping (their format differs from Yahoo Finance)
const STOOQ_SYMBOLS: Record<string, { stooq: string; name: string; currency: string }> = {
  '^GSPC':    { stooq: '^SPX',     name: 'S&P 500',         currency: 'USD' },
  '^IXIC':    { stooq: '^NDQ',     name: '纳斯达克综合',     currency: 'USD' },
  '^NDX':     { stooq: '^NDX',     name: '纳斯达克100',      currency: 'USD' },
  '^DJI':     { stooq: '^DJI',     name: '道琼斯',           currency: 'USD' },
  '^RUT':     { stooq: 'IWM.US',   name: '罗素2000',         currency: 'USD' },
  '^VIX':     { stooq: 'VIXY.US',  name: 'VIX恐慌指数',      currency: 'USD' },
  '^TNX':     { stooq: 'TLT.US',   name: '美债10Y收益率',    currency: 'USD' },
  '000001.SS':{ stooq: '^SHC',     name: '上证指数',         currency: 'CNY' },
  '399001.SZ':{ stooq: '^SZSE',    name: '深证成指',         currency: 'CNY' },
  '000300.SS':{ stooq: '^CSI300',  name: '沪深300',         currency: 'CNY' },
  '^HSI':     { stooq: '^HSI',     name: '恒生指数',         currency: 'HKD' },
  'GC=F':     { stooq: 'GC.F',     name: '黄金',             currency: 'USD' },
  'CL=F':     { stooq: 'CL.F',     name: 'WTI原油',          currency: 'USD' },
  'BZ=F':     { stooq: 'CB.F',     name: '布伦特原油',       currency: 'USD' },
  'HG=F':     { stooq: 'HG.F',     name: '铜',               currency: 'USD' },
  'USDCNY=X': { stooq: 'USDCNY',   name: '美元/人民币',      currency: 'CNY' },
  'DX-Y.NYB': { stooq: 'DX.F',     name: '美元指数',         currency: 'USD' },
  // US Sector ETFs
  XLK:        { stooq: 'XLK.US',   name: '科技板块 (XLK)',   currency: 'USD' },
  XLF:        { stooq: 'XLF.US',   name: '金融板块 (XLF)',   currency: 'USD' },
  XLE:        { stooq: 'XLE.US',   name: '能源板块 (XLE)',   currency: 'USD' },
  XLV:        { stooq: 'XLV.US',   name: '医疗板块 (XLV)',   currency: 'USD' },
  XLY:        { stooq: 'XLY.US',   name: '可选消费 (XLY)',   currency: 'USD' },
  XLP:        { stooq: 'XLP.US',   name: '必选消费 (XLP)',   currency: 'USD' },
  XLI:        { stooq: 'XLI.US',   name: '工业板块 (XLI)',   currency: 'USD' },
  XLU:        { stooq: 'XLU.US',   name: '公用事业 (XLU)',   currency: 'USD' },
  XLRE:       { stooq: 'XLRE.US',  name: '房地产 (XLRE)',    currency: 'USD' },
  XLB:        { stooq: 'XLB.US',   name: '原材料 (XLB)',     currency: 'USD' },
  XLC:        { stooq: 'XLC.US',   name: '通信服务 (XLC)',   currency: 'USD' },
  SMH:        { stooq: 'SMH.US',   name: '半导体 (SMH)',     currency: 'USD' },
  TLT:        { stooq: 'TLT.US',   name: '20年+长债 (TLT)',  currency: 'USD' },
  HYG:        { stooq: 'HYG.US',   name: '高收益债 (HYG)',   currency: 'USD' },
};

async function fetchStooqQuote(stooqSymbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcvn&h&e=csv`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; boardeco/1.0)',
        Accept: 'text/csv,text/plain',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const parts = lines[1].split(',');
    // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume,Name
    const close = parseFloat(parts[6]);
    const open = parseFloat(parts[3]);
    if (isNaN(close)) return null;
    return { price: close, prevClose: open };
  } catch {
    return null;
  }
}

async function buildQuote(yahooSym: string): Promise<StooqQuote | null> {
  const info = STOOQ_SYMBOLS[yahooSym];
  if (!info) return null;

  const cboe = CBOE_OVERRIDES[yahooSym];
  if (cboe) {
    const c = await fetchCboeQuote(cboe.cboe);
    if (c) {
      const div = cboe.divisor ?? 1;
      return {
        symbol: yahooSym,
        name: info.name,
        price: c.price / div,
        change: c.change / div,
        changePercent: c.changePercent,
        previousClose: c.prevClose / div,
        currency: info.currency,
        timestamp: Date.now(),
      };
    }
    // fall through to Stooq if CBOE fails
  }

  const data = await fetchStooqQuote(info.stooq);
  if (!data || !data.price) return null;
  const change = data.price - data.prevClose;
  const changePercent = data.prevClose !== 0 ? (change / data.prevClose) * 100 : 0;
  return {
    symbol: yahooSym,
    name: info.name,
    price: data.price,
    change,
    changePercent,
    previousClose: data.prevClose,
    currency: info.currency,
    timestamp: Date.now(),
  };
}

// Stooq throttles bursts of parallel requests. Limit concurrency to keep results consistent.
const STOOQ_CONCURRENCY = 6;

export async function getStooqQuotes(yahooSymbols: string[]): Promise<StooqQuote[]> {
  const results: StooqQuote[] = [];
  for (let i = 0; i < yahooSymbols.length; i += STOOQ_CONCURRENCY) {
    const batch = yahooSymbols.slice(i, i + STOOQ_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(buildQuote));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }
  return results;
}
