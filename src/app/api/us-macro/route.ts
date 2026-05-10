import { NextResponse } from 'next/server';
import { getLatestValue, getSeriesHistory, FRED_SERIES } from '@/lib/fred';
import { fetchShillerPE } from '@/lib/multpl';

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    const [
      fedFunds,
      treasury10y,
      treasury2y,
      tips10y,
      breakeven10y,
      mortgage30y,
      cpi,
      cpiCore,
      pce,
      unemployment,
      nfp,
      ahe,
      jolts,
      gdpGrowth,
      gdpNominal,
      m2,
      fedBs,
      hyOas,
      retailSales,
      initialClaims,
      consumerSentiment,
      shillerPE,
      // History for charts / explainers
      fedHistory,
      t10yHistory,
      cpiHistory,
      unemploymentHistory,
      gdpHistory,
      nfpHistory,
      hyOasHistory,
      fedBsHistory,
    ] = await Promise.all([
      getLatestValue(FRED_SERIES.FED_FUNDS_RATE),
      getLatestValue(FRED_SERIES.TREASURY_10Y),
      getLatestValue(FRED_SERIES.TREASURY_2Y),
      getLatestValue(FRED_SERIES.TIPS_10Y),
      getLatestValue(FRED_SERIES.BREAKEVEN_10Y),
      getLatestValue(FRED_SERIES.MORTGAGE_30Y),
      getLatestValue(FRED_SERIES.CPI_ALL),
      getLatestValue(FRED_SERIES.CPI_CORE),
      getLatestValue(FRED_SERIES.PCE_CORE),
      getLatestValue(FRED_SERIES.UNEMPLOYMENT),
      getLatestValue(FRED_SERIES.NONFARM_PAYROLLS),
      getLatestValue(FRED_SERIES.AVG_HOURLY_EARNINGS),
      getLatestValue(FRED_SERIES.JOB_OPENINGS),
      getLatestValue(FRED_SERIES.GDP_GROWTH),
      getLatestValue(FRED_SERIES.GDP_NOMINAL),
      getLatestValue(FRED_SERIES.M2),
      getLatestValue(FRED_SERIES.FED_BALANCE_SHEET),
      getLatestValue(FRED_SERIES.HY_OAS),
      getLatestValue(FRED_SERIES.RETAIL_SALES),
      getLatestValue(FRED_SERIES.INITIAL_CLAIMS),
      getLatestValue(FRED_SERIES.CONSUMER_SENTIMENT),
      fetchShillerPE(),
      getSeriesHistory(FRED_SERIES.FED_FUNDS_RATE, 36),
      getSeriesHistory(FRED_SERIES.TREASURY_10Y, 60),
      getSeriesHistory(FRED_SERIES.CPI_ALL, 36),
      getSeriesHistory(FRED_SERIES.UNEMPLOYMENT, 36),
      getSeriesHistory(FRED_SERIES.GDP_GROWTH, 20),
      getSeriesHistory(FRED_SERIES.NONFARM_PAYROLLS, 36),
      getSeriesHistory(FRED_SERIES.HY_OAS, 60),
      getSeriesHistory(FRED_SERIES.FED_BALANCE_SHEET, 60),
    ]);

    // YoY CPI change
    const cpiYoY = cpiHistory.length >= 13
      ? ((cpiHistory[cpiHistory.length - 1]?.value
          ? parseFloat(cpiHistory[cpiHistory.length - 1].value)
          : 0) /
         (parseFloat(cpiHistory[cpiHistory.length - 13]?.value || '1') || 1) - 1) * 100
      : null;

    // 10Y - 2Y yield curve
    const yieldSpread =
      treasury10y && treasury2y
        ? treasury10y.value - treasury2y.value
        : null;

    // NFP MoM change (in thousands of jobs added)
    const nfpMoM = nfpHistory.length >= 2
      ? parseFloat(nfpHistory[nfpHistory.length - 1].value) - parseFloat(nfpHistory[nfpHistory.length - 2].value)
      : null;

    // Wage growth YoY (Average Hourly Earnings)
    const aheHistory = await getSeriesHistory(FRED_SERIES.AVG_HOURLY_EARNINGS, 14);
    const aheYoY = aheHistory.length >= 13
      ? ((parseFloat(aheHistory[aheHistory.length - 1].value) /
          parseFloat(aheHistory[aheHistory.length - 13].value)) - 1) * 100
      : null;

    // Note: FRED removed the Wilshire 5000 series June 2024, so Buffett
    // Indicator can't be computed any more. Replaced with Shiller P/E (CAPE),
    // a similarly famous long-term valuation indicator scraped from multpl.com.

    return NextResponse.json({
      indicators: {
        fedFundsRate: fedFunds,
        treasury10y,
        treasury2y,
        tips10y,
        breakeven10y,
        mortgage30y,
        yieldSpread: yieldSpread !== null ? { value: yieldSpread, date: treasury10y?.date } : null,
        cpi,
        cpiCore,
        cpiYoY: cpiYoY !== null ? { value: parseFloat(cpiYoY.toFixed(2)), date: cpi?.date } : null,
        pce,
        unemployment,
        nfp,
        nfpMoM: nfpMoM !== null ? { value: parseFloat(nfpMoM.toFixed(0)), date: nfp?.date } : null,
        ahe,
        aheYoY: aheYoY !== null ? { value: parseFloat(aheYoY.toFixed(2)), date: ahe?.date } : null,
        jolts,
        gdpGrowth,
        gdpNominal,
        m2,
        fedBs,
        hyOas,
        retailSales,
        initialClaims,
        consumerSentiment,
        shillerPE: shillerPE
          ? { value: parseFloat(shillerPE.value.toFixed(2)), date: shillerPE.date }
          : null,
      },
      history: {
        fedFunds: fedHistory,
        treasury10y: t10yHistory,
        cpi: cpiHistory,
        unemployment: unemploymentHistory,
        gdp: gdpHistory,
        nfp: nfpHistory,
        hyOas: hyOasHistory,
        fedBs: fedBsHistory,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
