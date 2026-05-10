// Scrapes a single Shiller P/E (CAPE) value from multpl.com.
// Used because FRED removed the Wilshire 5000 series (June 2024) which
// was the basis for the Buffett Indicator. CAPE serves the same
// "is the market expensive long-term" question.

export async function fetchShillerPE(): Promise<{ value: number; date?: string } | null> {
  try {
    const res = await fetch('https://www.multpl.com/shiller-pe', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      next: { revalidate: 86400 }, // 24h cache
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Page contains "Current Shiller PE Ratio is 42.05, a change of ..."
    const m = html.match(/Current Shiller PE Ratio is ([0-9]+(?:\.[0-9]+)?)/);
    if (!m) return null;
    const value = parseFloat(m[1]);
    if (isNaN(value)) return null;
    // Extract date if present (typical format "May 9, 2026")
    const dm = html.match(/Current Shiller PE Ratio[^<]*<\/h2>\s*<div[^>]*>[^,]+,\s*([A-Z][a-z]+ \d{1,2},\s*\d{4})/);
    return { value, date: dm?.[1] };
  } catch {
    return null;
  }
}
