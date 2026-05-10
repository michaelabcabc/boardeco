// Fetches historical price series for a symbol from Yahoo Finance's public chart endpoint.
// No auth required — works for all major indices and ETFs.

export interface PricePoint {
  date: string;   // ISO yyyy-mm-dd
  close: number;
}

export type HistoryRange = '1y' | '5y';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function fetchHistory(symbol: string, range: HistoryRange): Promise<PricePoint[]> {
  const interval = range === '1y' ? '1d' : '1wk';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      next: { revalidate: range === '1y' ? 3600 : 86400 }, // 1h for 1y, 24h for 5y
    });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: number[] = result.indicators?.quote?.[0]?.close || [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: closes[i],
      }))
      .filter((d): d is PricePoint => d.close != null && !isNaN(d.close));
  } catch {
    return [];
  }
}
