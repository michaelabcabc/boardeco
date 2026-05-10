'use client';

// Maps S&P 500 sectors to their sensitivity to key macro factors
// Helps retail users understand which sectors win/lose under different regimes

interface SectorRow {
  ticker: string;
  name: string;
  rateSensitive: 'high-pos' | 'high-neg' | 'mid' | 'low';
  cyclical: 'cyclical' | 'defensive' | 'mixed';
  inflationHedge: 'win' | 'lose' | 'neutral' | 'mixed';
  notes: string;
}

const SECTORS: SectorRow[] = [
  {
    ticker: 'XLK',
    name: '科技',
    rateSensitive: 'high-neg',
    cyclical: 'cyclical',
    inflationHedge: 'lose',
    notes: '高估值，对利率最敏感。降息周期最大受益板块。',
  },
  {
    ticker: 'XLC',
    name: '通信服务',
    rateSensitive: 'high-neg',
    cyclical: 'cyclical',
    inflationHedge: 'lose',
    notes: '含 GOOGL、META，与科技相似的成长属性。',
  },
  {
    ticker: 'XLY',
    name: '可选消费',
    rateSensitive: 'mid',
    cyclical: 'cyclical',
    inflationHedge: 'lose',
    notes: '含 AMZN、TSLA。经济好时受益，衰退期承压。',
  },
  {
    ticker: 'XLF',
    name: '金融',
    rateSensitive: 'high-pos',
    cyclical: 'cyclical',
    inflationHedge: 'neutral',
    notes: '银行受益于净息差扩大；陡峭收益率曲线对其有利。',
  },
  {
    ticker: 'XLI',
    name: '工业',
    rateSensitive: 'mid',
    cyclical: 'cyclical',
    inflationHedge: 'neutral',
    notes: '与制造业景气度（PMI）高度相关。',
  },
  {
    ticker: 'XLB',
    name: '原材料',
    rateSensitive: 'mid',
    cyclical: 'cyclical',
    inflationHedge: 'win',
    notes: '受益于通胀和大宗商品涨价。',
  },
  {
    ticker: 'XLE',
    name: '能源',
    rateSensitive: 'low',
    cyclical: 'cyclical',
    inflationHedge: 'win',
    notes: '油价驱动；通胀高企时表现最好。',
  },
  {
    ticker: 'XLV',
    name: '医疗',
    rateSensitive: 'low',
    cyclical: 'defensive',
    inflationHedge: 'neutral',
    notes: '需求刚性，衰退期相对抗跌。',
  },
  {
    ticker: 'XLP',
    name: '必选消费',
    rateSensitive: 'low',
    cyclical: 'defensive',
    inflationHedge: 'neutral',
    notes: '日用品需求稳定，避险时获资金青睐。',
  },
  {
    ticker: 'XLU',
    name: '公用事业',
    rateSensitive: 'high-neg',
    cyclical: 'defensive',
    inflationHedge: 'lose',
    notes: '"债券替代品"——利率↑时承压，但衰退期防御。',
  },
  {
    ticker: 'XLRE',
    name: '房地产',
    rateSensitive: 'high-neg',
    cyclical: 'mixed',
    inflationHedge: 'mixed',
    notes: 'REITs 对利率高度敏感；融资成本是关键。',
  },
];

const rateLabel: Record<SectorRow['rateSensitive'], { txt: string; cls: string }> = {
  'high-pos': { txt: '高·正向', cls: 'text-emerald-400 bg-emerald-500/10' },
  'high-neg': { txt: '高·反向', cls: 'text-red-400 bg-red-500/10' },
  mid: { txt: '中等', cls: 'text-amber-400 bg-amber-500/10' },
  low: { txt: '低', cls: 'text-slate-400 bg-slate-700/40' },
};

const cyclicalLabel: Record<SectorRow['cyclical'], { txt: string; cls: string }> = {
  cyclical: { txt: '周期', cls: 'text-orange-400 bg-orange-500/10' },
  defensive: { txt: '防御', cls: 'text-cyan-400 bg-cyan-500/10' },
  mixed: { txt: '混合', cls: 'text-slate-400 bg-slate-700/40' },
};

const inflationLabel: Record<SectorRow['inflationHedge'], { txt: string; cls: string }> = {
  win: { txt: '受益', cls: 'text-emerald-400 bg-emerald-500/10' },
  lose: { txt: '承压', cls: 'text-red-400 bg-red-500/10' },
  neutral: { txt: '中性', cls: 'text-slate-400 bg-slate-700/40' },
  mixed: { txt: '混合', cls: 'text-amber-400 bg-amber-500/10' },
};

export default function SectorSensitivity() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">🎯 美股板块对宏观的敏感性</h3>
      <p className="text-xs text-slate-500 mb-4">
        不同板块对利率、经济周期、通胀的反应不同。看懂这张表，就知道在什么宏观环境下应该配什么板块。
      </p>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-500">
              <th className="text-left font-medium px-2 py-2">板块</th>
              <th className="text-left font-medium px-2 py-2">对利率敏感度</th>
              <th className="text-left font-medium px-2 py-2">周期 / 防御</th>
              <th className="text-left font-medium px-2 py-2">通胀环境</th>
              <th className="text-left font-medium px-2 py-2">说明</th>
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(s => (
              <tr key={s.ticker} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                <td className="px-2 py-2.5">
                  <div className="font-semibold text-slate-200">{s.name}</div>
                  <div className="text-slate-500 text-[10px]">{s.ticker}</div>
                </td>
                <td className="px-2 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded ${rateLabel[s.rateSensitive].cls}`}>
                    {rateLabel[s.rateSensitive].txt}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded ${cyclicalLabel[s.cyclical].cls}`}>
                    {cyclicalLabel[s.cyclical].txt}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded ${inflationLabel[s.inflationHedge].cls}`}>
                    {inflationLabel[s.inflationHedge].txt}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-slate-400 leading-snug">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
          <div className="text-emerald-400 font-semibold mb-1">📈 降息周期开启</div>
          <p className="text-slate-400 leading-relaxed">
            利好：科技 (XLK)、通信 (XLC)、可选消费 (XLY)、房地产 (XLRE)、长债 (TLT)
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
          <div className="text-amber-400 font-semibold mb-1">🔥 高通胀 + 加息</div>
          <p className="text-slate-400 leading-relaxed">
            利好：能源 (XLE)、原材料 (XLB)、金融 (XLF)；承压：科技、公用事业、长债
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
          <div className="text-cyan-400 font-semibold mb-1">⚠️ 衰退预期升温</div>
          <p className="text-slate-400 leading-relaxed">
            避险：必选消费 (XLP)、医疗 (XLV)、公用事业 (XLU)、长债 (TLT)
          </p>
        </div>
      </div>
    </div>
  );
}
