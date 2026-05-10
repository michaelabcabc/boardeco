// Fetches structured fundamentals for a US stock from Yahoo Finance's
// quoteSummary endpoint. Reuses the crumb/cookie logic also used for quotes.

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
};

let cachedCrumb: string | null = null;
let cachedCookie: string | null = null;
let crumbFetchedAt = 0;
const CRUMB_TTL = 55 * 60 * 1000;

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  const now = Date.now();
  if (cachedCrumb && cachedCookie && now - crumbFetchedAt < CRUMB_TTL) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }
  try {
    // Yahoo's homepage no longer drops a usable cookie for non-EU users.
    // fc.yahoo.com is the consent endpoint that always sets the A1/A3 session
    // cookies needed by query1.finance.yahoo.com.
    const consentRes = await fetch('https://fc.yahoo.com/', {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });
    const rawCookies = consentRes.headers.get('set-cookie') || '';
    const cookie = rawCookies
      .split(',')
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
    if (!cookie) return null;

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...BROWSER_HEADERS, Cookie: cookie },
    });
    if (!crumbRes.ok) return null;
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.length > 32 || crumb.includes('<') || crumb.includes('error')) return null;
    cachedCrumb = crumb;
    cachedCookie = cookie;
    crumbFetchedAt = now;
    return { crumb, cookie };
  } catch {
    return null;
  }
}

// A Yahoo "value object" wraps a number as { raw, fmt, longFmt, ... }.
// Sometimes the field is just a primitive — handle both.
type YV<T> = { raw?: T; fmt?: string } | T | undefined;
function v<T>(x: YV<T>): T | undefined {
  if (x === null || x === undefined) return undefined;
  if (typeof x === 'object' && 'raw' in (x as object)) return (x as { raw?: T }).raw;
  return x as T;
}

export interface StockFundamentals {
  symbol: string;
  // Profile
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
  // Price
  price?: number;
  priceChangePct?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  beta?: number;
  // Valuation
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  priceToSalesTrailing12Months?: number;
  pegRatio?: number;
  enterpriseToEbitda?: number;
  // Profitability
  totalRevenue?: number;
  ebitda?: number;
  profitMargins?: number;
  operatingMargins?: number;
  grossMargins?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  // Growth
  revenueGrowth?: number;     // YoY
  earningsGrowth?: number;
  earningsQuarterlyGrowth?: number;
  // Financial health
  totalCash?: number;
  totalDebt?: number;
  debtToEquity?: number;
  currentRatio?: number;
  freeCashflow?: number;
  // Dividend
  dividendYield?: number;
  payoutRatio?: number;
  // Analyst
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  numberOfAnalystOpinions?: number;
  recommendationKey?: string;
  recommendationMean?: number;
  // EPS
  trailingEps?: number;
  forwardEps?: number;
  // Shares & Enterprise Value (used by DCF)
  sharesOutstanding?: number;
  enterpriseValue?: number;
  bookValue?: number;
}

const MODULES = [
  'summaryProfile',
  'summaryDetail',
  'defaultKeyStatistics',
  'financialData',
  'price',
].join(',');

export async function fetchStockFundamentals(symbol: string): Promise<StockFundamentals | null> {
  const auth = await getCrumb();
  const params = new URLSearchParams({ modules: MODULES });
  if (auth) params.set('crumb', auth.crumb);
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?${params}`;

  try {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, ...(auth ? { Cookie: auth.cookie } : {}) },
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        cachedCrumb = null;
        cachedCookie = null;
      }
      return null;
    }
    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const profile = result.summaryProfile || {};
    const summary = result.summaryDetail || {};
    const stats = result.defaultKeyStatistics || {};
    const fin = result.financialData || {};
    const price = result.price || {};

    return {
      symbol,
      shortName: price.shortName || stats.shortName,
      longName: price.longName,
      exchange: price.exchangeName,
      currency: price.currency || summary.currency,
      sector: profile.sector,
      industry: profile.industry,
      country: profile.country,
      website: profile.website,
      fullTimeEmployees: profile.fullTimeEmployees,
      longBusinessSummary: profile.longBusinessSummary,

      price: v(price.regularMarketPrice) ?? v(fin.currentPrice),
      priceChangePct: v(price.regularMarketChangePercent),
      marketCap: v(price.marketCap) ?? v(summary.marketCap),
      fiftyTwoWeekHigh: v(summary.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: v(summary.fiftyTwoWeekLow),
      fiftyDayAverage: v(summary.fiftyDayAverage),
      twoHundredDayAverage: v(summary.twoHundredDayAverage),
      beta: v(summary.beta) ?? v(stats.beta),

      trailingPE: v(summary.trailingPE),
      forwardPE: v(summary.forwardPE) ?? v(stats.forwardPE),
      priceToBook: v(stats.priceToBook),
      priceToSalesTrailing12Months: v(summary.priceToSalesTrailing12Months),
      pegRatio: v(stats.pegRatio),
      enterpriseToEbitda: v(stats.enterpriseToEbitda),

      totalRevenue: v(fin.totalRevenue),
      ebitda: v(fin.ebitda),
      profitMargins: v(fin.profitMargins) ?? v(stats.profitMargins),
      operatingMargins: v(fin.operatingMargins),
      grossMargins: v(fin.grossMargins),
      returnOnEquity: v(fin.returnOnEquity),
      returnOnAssets: v(fin.returnOnAssets),

      revenueGrowth: v(fin.revenueGrowth),
      earningsGrowth: v(fin.earningsGrowth),
      earningsQuarterlyGrowth: v(stats.earningsQuarterlyGrowth),

      totalCash: v(fin.totalCash),
      totalDebt: v(fin.totalDebt),
      debtToEquity: v(fin.debtToEquity),
      currentRatio: v(fin.currentRatio),
      freeCashflow: v(fin.freeCashflow),

      dividendYield: v(summary.dividendYield),
      payoutRatio: v(summary.payoutRatio),

      targetMeanPrice: v(fin.targetMeanPrice),
      targetHighPrice: v(fin.targetHighPrice),
      targetLowPrice: v(fin.targetLowPrice),
      numberOfAnalystOpinions: v(fin.numberOfAnalystOpinions),
      recommendationKey: fin.recommendationKey,
      recommendationMean: v(fin.recommendationMean),

      trailingEps: v(stats.trailingEps),
      forwardEps: v(stats.forwardEps),
      sharesOutstanding: v(stats.sharesOutstanding) ?? v(price.sharesOutstanding),
      enterpriseValue: v(stats.enterpriseValue),
      bookValue: v(stats.bookValue),
    };
  } catch {
    return null;
  }
}
