import { NextResponse } from 'next/server';
import { getLatestValue, getSeriesHistory, FRED_SERIES } from '@/lib/fred';

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    const [
      fedFunds,
      treasury10y,
      treasury2y,
      cpi,
      cpiCore,
      pce,
      unemployment,
      gdpGrowth,
      m2,
      retailSales,
      initialClaims,
      consumerSentiment,
      // History for charts
      fedHistory,
      t10yHistory,
      cpiHistory,
      unemploymentHistory,
      gdpHistory,
    ] = await Promise.all([
      getLatestValue(FRED_SERIES.FED_FUNDS_RATE),
      getLatestValue(FRED_SERIES.TREASURY_10Y),
      getLatestValue(FRED_SERIES.TREASURY_2Y),
      getLatestValue(FRED_SERIES.CPI_ALL),
      getLatestValue(FRED_SERIES.CPI_CORE),
      getLatestValue(FRED_SERIES.PCE_CORE),
      getLatestValue(FRED_SERIES.UNEMPLOYMENT),
      getLatestValue(FRED_SERIES.GDP_GROWTH),
      getLatestValue(FRED_SERIES.M2),
      getLatestValue(FRED_SERIES.RETAIL_SALES),
      getLatestValue(FRED_SERIES.INITIAL_CLAIMS),
      getLatestValue(FRED_SERIES.CONSUMER_SENTIMENT),
      getSeriesHistory(FRED_SERIES.FED_FUNDS_RATE, 36),
      getSeriesHistory(FRED_SERIES.TREASURY_10Y, 60),
      getSeriesHistory(FRED_SERIES.CPI_ALL, 36),
      getSeriesHistory(FRED_SERIES.UNEMPLOYMENT, 36),
      getSeriesHistory(FRED_SERIES.GDP_GROWTH, 20),
    ]);

    // Calculate YoY CPI change
    const cpiYoY = cpiHistory.length >= 13
      ? ((cpiHistory[cpiHistory.length - 1]?.value
          ? parseFloat(cpiHistory[cpiHistory.length - 1].value)
          : 0) /
         (parseFloat(cpiHistory[cpiHistory.length - 13]?.value || '1') || 1) - 1) * 100
      : null;

    // Yield curve spread (10Y - 2Y)
    const yieldSpread =
      treasury10y && treasury2y
        ? treasury10y.value - treasury2y.value
        : null;

    return NextResponse.json({
      indicators: {
        fedFundsRate: fedFunds,
        treasury10y,
        treasury2y,
        yieldSpread: yieldSpread !== null ? { value: yieldSpread, date: treasury10y?.date } : null,
        cpi,
        cpiCore,
        cpiYoY: cpiYoY !== null ? { value: parseFloat(cpiYoY.toFixed(2)), date: cpi?.date } : null,
        pce,
        unemployment,
        gdpGrowth,
        m2,
        retailSales,
        initialClaims,
        consumerSentiment,
      },
      history: {
        fedFunds: fedHistory,
        treasury10y: t10yHistory,
        cpi: cpiHistory,
        unemployment: unemploymentHistory,
        gdp: gdpHistory,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
