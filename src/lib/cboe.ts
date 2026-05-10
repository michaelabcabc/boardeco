// CBOE delayed-quote endpoint for major US indices (^SPX, ^NDX, ^DJI, ^RUT, ^VIX, ^TNX).
// Public, no auth, returns clean JSON with both current price and prev close.

interface CboeResponse {
  data?: {
    current_price?: number;
    prev_day_close?: number;
    price_change?: number;
    price_change_percent?: number;
    open?: number;
    high?: number;
    low?: number;
  };
}

export interface CboeQuote {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
}

export async function fetchCboeQuote(cboeSymbol: string): Promise<CboeQuote | null> {
  try {
    const url = `https://cdn.cboe.com/api/global/delayed_quotes/quotes/${cboeSymbol}.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; boardeco/1.0)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json: CboeResponse = await res.json();
    const d = json?.data;
    if (!d || typeof d.current_price !== 'number' || d.current_price === 0) return null;
    const price = d.current_price;
    const prevClose = typeof d.prev_day_close === 'number' && d.prev_day_close > 0
      ? d.prev_day_close
      : (typeof d.open === 'number' ? d.open : price);
    const change = typeof d.price_change === 'number' ? d.price_change : price - prevClose;
    const changePercent = typeof d.price_change_percent === 'number'
      ? d.price_change_percent
      : prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return { price, prevClose, change, changePercent };
  } catch {
    return null;
  }
}
