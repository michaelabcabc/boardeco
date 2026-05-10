import { NextResponse } from 'next/server';
import { MARKET_SYMBOLS } from '@/lib/yahoo';
import { getStooqQuotes } from '@/lib/stooq';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const US_SYMBOLS = [
  MARKET_SYMBOLS.SP500,
  MARKET_SYMBOLS.NASDAQ,
  MARKET_SYMBOLS.NASDAQ100,
  MARKET_SYMBOLS.DOW,
  MARKET_SYMBOLS.RUSSELL2000,
  MARKET_SYMBOLS.VIX,
  MARKET_SYMBOLS.US10Y,
];

const US_SECTOR_SYMBOLS = [
  MARKET_SYMBOLS.XLK,
  MARKET_SYMBOLS.XLF,
  MARKET_SYMBOLS.XLE,
  MARKET_SYMBOLS.XLV,
  MARKET_SYMBOLS.XLY,
  MARKET_SYMBOLS.XLP,
  MARKET_SYMBOLS.XLI,
  MARKET_SYMBOLS.XLU,
  MARKET_SYMBOLS.XLRE,
  MARKET_SYMBOLS.XLB,
  MARKET_SYMBOLS.XLC,
  MARKET_SYMBOLS.SMH,
  MARKET_SYMBOLS.TLT,
  MARKET_SYMBOLS.HYG,
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
    const allSymbols = [...US_SYMBOLS, ...US_SECTOR_SYMBOLS, ...CN_SYMBOLS, ...GLOBAL_SYMBOLS];
    const quotes = await getStooqQuotes(allSymbols);

    const result = {
      us: quotes.filter(q => (US_SYMBOLS as readonly string[]).includes(q.symbol)),
      usSectors: quotes.filter(q => (US_SECTOR_SYMBOLS as readonly string[]).includes(q.symbol)),
      cn: quotes.filter(q => (CN_SYMBOLS as readonly string[]).includes(q.symbol)),
      global: quotes.filter(q => (GLOBAL_SYMBOLS as readonly string[]).includes(q.symbol)),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (err) {
    return NextResponse.json(
      { us: [], usSectors: [], cn: [], global: [], updatedAt: new Date().toISOString(), error: String(err) },
      { status: 200 }
    );
  }
}
