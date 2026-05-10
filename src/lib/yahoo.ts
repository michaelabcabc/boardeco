// Yahoo Finance data fetcher - no API key required
// Uses unofficial Yahoo Finance API endpoints

export interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketCap?: number;
  currency: string;
  timestamp: number;
}

export interface HistoricalData {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

// Try both query1 and query2 endpoints (query2 is sometimes less rate-limited)
const YAHOO_QUERY_HOSTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
];
const YAHOO_QUOTE_PATH = '/v7/finance/quote';
const YAHOO_CHART_PATH = '/v8/finance/chart';

// Cycle through hosts on retry
let hostIndex = 0;
function getHost() {
  const host = YAHOO_QUERY_HOSTS[hostIndex % YAHOO_QUERY_HOSTS.length];
  hostIndex++;
  return host;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
};

export async function getQuotes(symbols: string[]): Promise<QuoteData[]> {
  try {
    const host = getHost();
    const url = new URL(`${host}${YAHOO_QUOTE_PATH}`);
    url.searchParams.set('symbols', symbols.join(','));
    url.searchParams.set('fields', 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,marketCap,shortName,longName,currency');

    const res = await fetch(url.toString(), {
      headers: HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);
    const data = await res.json();
    const results = data?.quoteResponse?.result || [];

    return results.map((r: Record<string, unknown>) => ({
      symbol: r.symbol as string,
      name: (r.shortName || r.longName || r.symbol) as string,
      price: r.regularMarketPrice as number,
      change: r.regularMarketChange as number,
      changePercent: r.regularMarketChangePercent as number,
      previousClose: r.regularMarketPreviousClose as number,
      open: r.regularMarketOpen as number | undefined,
      dayHigh: r.regularMarketDayHigh as number | undefined,
      dayLow: r.regularMarketDayLow as number | undefined,
      volume: r.regularMarketVolume as number | undefined,
      marketCap: r.marketCap as number | undefined,
      currency: (r.currency as string) || 'USD',
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.error('Yahoo Finance quotes error:', err);
    return [];
  }
}

export async function getHistorical(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1y'
): Promise<HistoricalData[]> {
  try {
    const host = getHost();
    const url = new URL(`${host}${YAHOO_CHART_PATH}/${symbol}`);
    url.searchParams.set('range', period);
    url.searchParams.set('interval', period === '1mo' ? '1d' : period === '3mo' ? '1d' : '1wk');

    const res = await fetch(url.toString(), {
      headers: HEADERS,
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance chart error: ${res.status}`);
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: number[] = result.indicators?.quote?.[0]?.close || [];
    const opens: number[] = result.indicators?.quote?.[0]?.open || [];
    const highs: number[] = result.indicators?.quote?.[0]?.high || [];
    const lows: number[] = result.indicators?.quote?.[0]?.low || [];
    const volumes: number[] = result.indicators?.quote?.[0]?.volume || [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i],
        open: opens[i],
        high: highs[i],
        low: lows[i],
        volume: volumes[i],
      }))
      .filter(d => d.close != null && !isNaN(d.close));
  } catch (err) {
    console.error('Yahoo Finance historical error:', err);
    return [];
  }
}

// Key market symbols
export const MARKET_SYMBOLS = {
  // US Indices
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  DOW: '^DJI',
  RUSSELL2000: '^RUT',
  VIX: '^VIX',

  // China/HK Indices
  SSE: '000001.SS',     // 上证指数
  SZSE: '399001.SZ',    // 深证成指
  CSI300: '000300.SS',  // 沪深300
  HKEX: '^HSI',         // 恒生指数

  // Commodities
  GOLD: 'GC=F',
  OIL_WTI: 'CL=F',
  OIL_BRENT: 'BZ=F',
  COPPER: 'HG=F',

  // FX
  USDCNY: 'USDCNY=X',
  USDHKD: 'USDHKD=X',
  DXY: 'DX-Y.NYB',       // Dollar Index

  // Bonds
  US10Y: '^TNX',
  US2Y: '^IRX',
} as const;

export const SYMBOL_NAMES: Record<string, string> = {
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
