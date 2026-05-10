// Yahoo Finance data fetcher with crumb authentication
// Yahoo Finance now requires a crumb token obtained from finance.yahoo.com

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

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
};

// Cache crumb + cookie in module scope (reused across requests within same Lambda instance)
let cachedCrumb: string | null = null;
let cachedCookie: string | null = null;
let crumbFetchedAt = 0;
const CRUMB_TTL = 55 * 60 * 1000; // 55 minutes

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  const now = Date.now();
  if (cachedCrumb && cachedCookie && now - crumbFetchedAt < CRUMB_TTL) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }

  try {
    // Step 1: Visit finance.yahoo.com to get cookies
    const pageRes = await fetch('https://finance.yahoo.com/', {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });
    const rawCookies = pageRes.headers.get('set-cookie') || '';
    // Extract cookie values
    const cookie = rawCookies
      .split(',')
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    // Step 2: Get crumb token
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        ...BROWSER_HEADERS,
        Cookie: cookie,
      },
    });
    if (!crumbRes.ok) throw new Error(`Crumb fetch failed: ${crumbRes.status}`);
    const crumb = await crumbRes.text();

    if (crumb && crumb.length > 0 && !crumb.includes('<')) {
      cachedCrumb = crumb.trim();
      cachedCookie = cookie;
      crumbFetchedAt = now;
      return { crumb: cachedCrumb, cookie: cachedCookie };
    }
    return null;
  } catch (err) {
    console.error('Failed to get Yahoo Finance crumb:', err);
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteData[]> {
  try {
    const auth = await getCrumb();

    const params = new URLSearchParams({
      symbols: symbols.join(','),
      fields: 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,marketCap,shortName,longName,currency',
    });

    if (auth) {
      params.set('crumb', auth.crumb);
    }

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?${params}`;

    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...(auth ? { Cookie: auth.cookie } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Yahoo Finance quotes error: ${res.status}`);
      // Reset crumb cache on auth errors
      if (res.status === 401 || res.status === 403) {
        cachedCrumb = null;
        cachedCookie = null;
      }
      return [];
    }

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
    const auth = await getCrumb();
    const interval = period === '1mo' ? '1d' : period === '3mo' ? '1d' : '1wk';

    const params = new URLSearchParams({
      range: period,
      interval,
      ...(auth ? { crumb: auth.crumb } : {}),
    });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?${params}`;

    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...(auth ? { Cookie: auth.cookie } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Yahoo Finance chart error: ${res.status}`);
      return [];
    }

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
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  NASDAQ100: '^NDX',
  DOW: '^DJI',
  RUSSELL2000: '^RUT',
  VIX: '^VIX',
  VIX9D: '^VIX9D',
  VIX3M: '^VIX3M',
  VIX6M: '^VIX6M',
  VVIX: '^VVIX',
  SKEW: '^SKEW',
  // Magnificent 7 — together drive ~30% of S&P 500 weight
  AAPL: 'AAPL',
  MSFT: 'MSFT',
  NVDA: 'NVDA',
  GOOGL: 'GOOGL',
  AMZN: 'AMZN',
  META: 'META',
  TSLA: 'TSLA',
  SSE: '000001.SS',
  SZSE: '399001.SZ',
  CSI300: '000300.SS',
  HKEX: '^HSI',
  GOLD: 'GC=F',
  OIL_WTI: 'CL=F',
  OIL_BRENT: 'BZ=F',
  COPPER: 'HG=F',
  USDCNY: 'USDCNY=X',
  USDHKD: 'USDHKD=X',
  DXY: 'DX-Y.NYB',
  US10Y: '^TNX',
  US2Y: '^IRX',
  // US sector ETFs (SPDR Select Sector)
  XLK: 'XLK',  // Tech
  XLF: 'XLF',  // Financial
  XLE: 'XLE',  // Energy
  XLV: 'XLV',  // Health Care
  XLY: 'XLY',  // Consumer Discretionary
  XLP: 'XLP',  // Consumer Staples
  XLI: 'XLI',  // Industrial
  XLU: 'XLU',  // Utilities
  XLRE: 'XLRE', // Real Estate
  XLB: 'XLB',  // Materials
  XLC: 'XLC',  // Communication Services
  // Magnificent 7 trackers
  SMH: 'SMH',  // Semiconductors
  // Bonds
  TLT: 'TLT',  // 20+ Yr Treasury ETF
  HYG: 'HYG',  // High Yield Corp Bond ETF
} as const;

export const SYMBOL_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': '纳斯达克综合',
  '^NDX': '纳斯达克100',
  '^DJI': '道琼斯',
  '^RUT': '罗素2000',
  '^VIX': 'VIX恐慌指数',
  '^VIX9D': 'VIX 9天',
  '^VIX3M': 'VIX 3个月',
  '^VIX6M': 'VIX 6个月',
  '^VVIX': 'VVIX (VIX的VIX)',
  '^SKEW': 'SKEW 尾部风险',
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  NVDA: 'NVIDIA',
  GOOGL: 'Alphabet',
  AMZN: 'Amazon',
  META: 'Meta',
  TSLA: 'Tesla',
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
