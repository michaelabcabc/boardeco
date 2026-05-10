import { NextResponse } from 'next/server';
import { getHistorical } from '@/lib/yahoo';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || '^GSPC';
  const period = (searchParams.get('period') || '1y') as '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

  try {
    const data = await getHistorical(symbol, period);
    return NextResponse.json({ symbol, period, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
