// Stooq.com - free stock data, no API key required, no rate limiting issues
// Works well from server-side environments

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

// Stooq symbol mapping (their format differs from Yahoo Finance)
const STOOQ_SYMBOLS: Record<string, { stooq: string; name: string; currency: string }> = {
  '^GSPC':    { stooq: 'SPX',      name: 'S&P 500',       currency: 'USD' },
  '^IXIC':    { stooq: 'COMP.IND', name: '纳斯达克',       currency: 'USD' },
  '^DJI':     { stooq: 'DJI',      name: '道琼斯',         currency: 'USD' },
  '^VIX':     { stooq: 'VIX.IND',  name: 'VIX恐慌指数',   currency: 'USD' },
  '^TNX':     { stooq: 'TNX.B',    name: '美债10Y',        currency: 'USD' },
  '000001.SS':{ stooq: '000001.CN', name: '上证指数',      currency: 'CNY' },
  '399001.SZ':{ stooq: '399001.SZ', name: '深证成指',      currency: 'CNY' },
  '000300.SS':{ stooq: '000300.CN', name: '沪深300',       currency: 'CNY' },
  '^HSI':     { stooq: 'HSI.HK',   name: '恒生指数',       currency: 'HKD' },
  'GC=F':     { stooq: 'XAU.USD',  name: '黄金',           currency: 'USD' },
  'CL=F':     { stooq: 'CL.F',     name: 'WTI原油',        currency: 'USD' },
  'BZ=F':     { stooq: 'CB.F',     name: '布伦特原油',     currency: 'USD' },
  'HG=F':     { stooq: 'HG.F',     name: '铜',             currency: 'USD' },
  'USDCNY=X': { stooq: 'USDCNY',   name: '美元/人民币',    currency: 'CNY' },
  'DX-Y.NYB': { stooq: 'USDX.IND', name: '美元指数',       currency: 'USD' },
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

export async function getStooqQuotes(yahooSymbols: string[]): Promise<StooqQuote[]> {
  const results = await Promise.allSettled(
    yahooSymbols.map(async (yahooSym) => {
      const info = STOOQ_SYMBOLS[yahooSym];
      if (!info) return null;
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
      } as StooqQuote;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StooqQuote> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}
