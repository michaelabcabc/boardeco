import { NextRequest, NextResponse } from 'next/server';
import { fetchHistory, HistoryRange } from '@/lib/history';

export const revalidate = 3600;

const ALLOWED_SYMBOLS = new Set([
  '^GSPC', '^IXIC', '^NDX', '^DJI', '^RUT', '^VIX', '^TNX',
  '^VIX9D', '^VIX3M', '^VIX6M', '^VVIX', '^SKEW',
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
]);

const ALLOWED_RANGES: HistoryRange[] = ['1y', '5y'];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || '';
  const range = (req.nextUrl.searchParams.get('range') || '1y') as HistoryRange;

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return NextResponse.json({ error: 'invalid symbol' }, { status: 400 });
  }
  if (!ALLOWED_RANGES.includes(range)) {
    return NextResponse.json({ error: 'invalid range' }, { status: 400 });
  }

  const data = await fetchHistory(symbol, range);
  return NextResponse.json({ symbol, range, data });
}
