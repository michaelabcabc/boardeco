import { NextResponse } from 'next/server';
import { getQuotes, MARKET_SYMBOLS } from '@/lib/yahoo';

// Force dynamic so it's never pre-rendered at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const US_SYMBOLS = [
  MARKET_SYMBOLS.SP500,
  MARKET_SYMBOLS.NASDAQ,
  MARKET_SYMBOLS.DOW,
  MARKET_SYMBOLS.VIX,
  MARKET_SYMBOLS.US10Y,
];

const CN_SYMBOLS = [
  MARKET_SYMBOLS.SSE,
  MARKET_SYMBOLS.SZSE,
  MARKET_SYMBOLS.CSI300,
  MARKET_SYMBOLS.HKEX,
];

const GLOBAL_SYMBOLS = [
  MARKET_SYMBOLS.GOLD,
  MARKET_SYMBOLS.OIL_WTI,
  MARKET_SYMBOLS.OIL_BRENT,
  MARKET_SYMBOLS.USDCNY,
  MARKET_SYMBOLS.DXY,
  MARKET_SYMBOLS.COPPER,
];

// Retry with exponential backoff for rate limiting
async function getQuotesWithRetry(symbols: string[], maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const quotes = await getQuotes(symbols);
    if (quotes.length > 0) return quotes;
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return [];
}

export async function GET() {
  try {
    const allSymbols = [...US_SYMBOLS, ...CN_SYMBOLS, ...GLOBAL_SYMBOLS];
    const quotes = await getQuotesWithRetry(allSymbols);

    const result = {
      us: quotes.filter(q => (US_SYMBOLS as readonly string[]).includes(q.symbol)),
      cn: quotes.filter(q => (CN_SYMBOLS as readonly string[]).includes(q.symbol)),
      global: quotes.filter(q => (GLOBAL_SYMBOLS as readonly string[]).includes(q.symbol)),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { us: [], cn: [], global: [], updatedAt: new Date().toISOString(), error: String(err) },
      { status: 200 } // Return 200 with empty data so UI handles gracefully
    );
  }
}
