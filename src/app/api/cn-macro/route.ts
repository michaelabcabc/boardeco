import { NextResponse } from 'next/server';
import { getChinaIndicator, WB_INDICATORS } from '@/lib/worldbank';
import { getQuotes } from '@/lib/yahoo';

export const revalidate = 3600;

// Fetch China macro data from multiple sources
async function fetchChinaPMI() {
  // NBS official PMI - scrape from investing.com data or use cached approach
  // Since direct NBS API requires registration, we use World Bank + Yahoo Finance FX
  return null;
}

// China 10Y bond yield via Yahoo Finance
const CN_BOND_SYMBOL = 'CNY=X'; // Fallback: use USDCNY for currency data

export async function GET() {
  try {
    const [
      gdpGrowth,
      inflation,
      unemployment,
      tradeExports,
      tradeImports,
      gdpTotal,
      broadMoney,
      // FX and bond proxies via Yahoo
      fxData,
    ] = await Promise.all([
      getChinaIndicator(WB_INDICATORS.GDP_GROWTH, 12),
      getChinaIndicator(WB_INDICATORS.INFLATION, 12),
      getChinaIndicator(WB_INDICATORS.UNEMPLOYMENT, 12),
      getChinaIndicator(WB_INDICATORS.EXPORTS, 12),
      getChinaIndicator(WB_INDICATORS.IMPORTS, 12),
      getChinaIndicator(WB_INDICATORS.GDP_TOTAL, 12),
      getChinaIndicator(WB_INDICATORS.BROAD_MONEY, 12),
      getQuotes(['USDCNY=X', 'CNH=X', '^HSI', '000001.SS']),
    ]);

    const latest = (arr: typeof gdpGrowth) => arr[0] || null;
    const toHistory = (arr: typeof gdpGrowth) =>
      arr.map(d => ({ date: d.date, value: d.value })).reverse();

    const usdcny = fxData.find(q => q.symbol === 'USDCNY=X');

    return NextResponse.json({
      indicators: {
        gdpGrowth: latest(gdpGrowth),
        inflation: latest(inflation),
        unemployment: latest(unemployment),
        exports: latest(tradeExports),
        imports: latest(tradeImports),
        gdpTotal: latest(gdpTotal),
        broadMoney: latest(broadMoney),
        usdcny: usdcny
          ? { value: usdcny.price, date: new Date().toISOString().split('T')[0] }
          : null,
      },
      history: {
        gdpGrowth: toHistory(gdpGrowth),
        inflation: toHistory(inflation),
        unemployment: toHistory(unemployment),
        exports: toHistory(tradeExports),
        imports: toHistory(tradeImports),
        broadMoney: toHistory(broadMoney),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
