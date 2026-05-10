import { NextResponse } from 'next/server';
import { getQuotes, MARKET_SYMBOLS } from '@/lib/yahoo';

export const revalidate = 300; // 5 min cache

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

export async function GET() {
  try {
    const allSymbols = [...US_SYMBOLS, ...CN_SYMBOLS, ...GLOBAL_SYMBOLS];
    const quotes = await getQuotes(allSymbols);

    return NextResponse.json({
      us: quotes.filter(q => US_SYMBOLS.includes(q.symbol as typeof US_SYMBOLS[number])),
      cn: quotes.filter(q => CN_SYMBOLS.includes(q.symbol as typeof CN_SYMBOLS[number])),
      global: quotes.filter(q => GLOBAL_SYMBOLS.includes(q.symbol as typeof GLOBAL_SYMBOLS[number])),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
