// World Bank Open Data API - no key required
// https://datahelpdesk.worldbank.org/knowledgebase/articles/898581

const WB_BASE = 'https://api.worldbank.org/v2';

export interface WBIndicator {
  date: string;
  value: number | null;
  indicator: { id: string; value: string };
  country: { id: string; value: string };
}

async function fetchWB(path: string, params: Record<string, string> = {}): Promise<WBIndicator[]> {
  const url = new URL(`${WB_BASE}${path}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('per_page', '20');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`);
  const data = await res.json();
  // Response is [metadata, data]
  return (data[1] || []).filter((d: WBIndicator) => d.value !== null);
}

export async function getChinaIndicator(indicatorId: string, years = 10): Promise<WBIndicator[]> {
  return fetchWB(`/country/CN/indicator/${indicatorId}`, {
    mrv: String(years),
  });
}

export async function getUSIndicator(indicatorId: string, years = 10): Promise<WBIndicator[]> {
  return fetchWB(`/country/US/indicator/${indicatorId}`, {
    mrv: String(years),
  });
}

// World Bank indicator codes
export const WB_INDICATORS = {
  // GDP
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',      // GDP growth (annual %)
  GDP_PER_CAPITA: 'NY.GDP.PCAP.CD',       // GDP per capita (USD)
  GDP_TOTAL: 'NY.GDP.MKTP.CD',            // GDP total (USD)

  // Trade
  EXPORTS: 'NE.EXP.GNFS.ZS',             // Exports % of GDP
  IMPORTS: 'NE.IMP.GNFS.ZS',             // Imports % of GDP
  TRADE_BALANCE: 'BN.CAB.XOKA.CD',        // Current account balance

  // Inflation
  INFLATION: 'FP.CPI.TOTL.ZG',           // Inflation, consumer prices (annual %)

  // Industry
  INDUSTRY_VALUE: 'NV.IND.TOTL.ZS',      // Industry value added % GDP
  MANUFACTURING: 'NV.IND.MANF.ZS',       // Manufacturing % GDP

  // Finance
  BROAD_MONEY: 'FM.LBL.BMNY.GD.ZS',     // Broad money % GDP
  REAL_INTEREST: 'FR.INR.RINR',          // Real interest rate

  // Demographics
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',        // Unemployment total %
  POPULATION: 'SP.POP.TOTL',             // Population
} as const;
