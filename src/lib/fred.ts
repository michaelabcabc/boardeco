// FRED (Federal Reserve Economic Data) API client
// Free API key from https://fred.stlouisfed.org/docs/api/api_key.html

const FRED_BASE = 'https://api.stlouisfed.org/fred';
const API_KEY = process.env.FRED_API_KEY || '';

export interface FredObservation {
  date: string;
  value: string;
}

export interface FredSeries {
  id: string;
  title: string;
  observations: FredObservation[];
}

async function fetchFred(path: string, params: Record<string, string> = {}) {
  if (!API_KEY) throw new Error('FRED_API_KEY not configured');
  const url = new URL(`${FRED_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('file_type', 'json');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`);
  return res.json();
}

export async function getLatestValue(seriesId: string): Promise<{ value: number; date: string } | null> {
  try {
    const data = await fetchFred('/series/observations', {
      series_id: seriesId,
      sort_order: 'desc',
      limit: '2',
    });
    const obs: FredObservation[] = data.observations || [];
    const valid = obs.find(o => o.value !== '.');
    if (!valid) return null;
    return { value: parseFloat(valid.value), date: valid.date };
  } catch {
    return null;
  }
}

export async function getSeriesHistory(
  seriesId: string,
  limit = 60
): Promise<FredObservation[]> {
  try {
    const data = await fetchFred('/series/observations', {
      series_id: seriesId,
      sort_order: 'desc',
      limit: String(limit),
    });
    const obs: FredObservation[] = (data.observations || []).filter(
      (o: FredObservation) => o.value !== '.'
    );
    return obs.reverse();
  } catch {
    return [];
  }
}

// Key FRED series IDs
export const FRED_SERIES = {
  // US Interest Rates
  FED_FUNDS_RATE: 'FEDFUNDS',
  TREASURY_10Y: 'DGS10',
  TREASURY_2Y: 'DGS2',
  TREASURY_3M: 'DGS3MO',

  // US Inflation
  CPI_ALL: 'CPIAUCSL',
  CPI_CORE: 'CPILFESL',
  PCE: 'PCEPI',
  PCE_CORE: 'PCEPILFE',

  // US Labor
  UNEMPLOYMENT: 'UNRATE',
  NONFARM_PAYROLLS: 'PAYEMS',
  INITIAL_CLAIMS: 'ICSA',

  // US Growth
  GDP_GROWTH: 'A191RL1Q225SBEA',
  RETAIL_SALES: 'RSXFS',
  INDUSTRIAL_PRODUCTION: 'INDPRO',

  // US Money Supply
  M2: 'M2SL',

  // US Housing
  HOUSING_STARTS: 'HOUST',

  // US Sentiment
  CONSUMER_SENTIMENT: 'UMCSENT',
} as const;
