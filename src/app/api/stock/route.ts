import { NextRequest, NextResponse } from 'next/server';
import { fetchStockFundamentals } from '@/lib/stock-fundamentals';
import { fetchHistory } from '@/lib/history';

export const dynamic = 'force-dynamic';

const TICKER_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbol') || '';
  const symbol = raw.trim().toUpperCase();
  if (!symbol || !TICKER_RE.test(symbol)) {
    return NextResponse.json({ error: 'invalid symbol' }, { status: 400 });
  }

  const [fundamentals, history1y, history5y] = await Promise.all([
    fetchStockFundamentals(symbol),
    fetchHistory(symbol, '1y'),
    fetchHistory(symbol, '5y'),
  ]);

  if (!fundamentals) {
    return NextResponse.json(
      { error: 'fetch failed', symbol, hint: 'symbol may not exist or upstream rate-limited' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    symbol,
    fundamentals,
    history: { '1y': history1y, '5y': history5y },
    fetchedAt: new Date().toISOString(),
  });
}
