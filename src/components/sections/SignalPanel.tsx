'use client';

// Market signal analysis based on macro indicators
// Provides qualitative stock market outlook signals

interface Signal {
  name: string;
  value: string;
  interpretation: string;
  signal: 'bullish' | 'bearish' | 'neutral' | 'caution';
  weight: number;
}

interface SignalPanelProps {
  fedRate?: number | null;
  cpiYoY?: number | null;
  unemployment?: number | null;
  gdpGrowth?: number | null;
  yieldSpread?: number | null;
  vix?: number | null;
  consumerSentiment?: number | null;
}

function computeSignals(props: SignalPanelProps): Signal[] {
  const signals: Signal[] = [];

  // Fed Rate signal
  if (props.fedRate !== null && props.fedRate !== undefined) {
    const rate = props.fedRate;
    signals.push({
      name: '联储利率',
      value: `${rate.toFixed(2)}%`,
      interpretation: rate > 5 ? '高利率压制估值，流动性偏紧' : rate > 3 ? '利率适中，关注降息时间窗口' : '低利率环境，有利于风险资产',
      signal: rate > 5 ? 'bearish' : rate > 3 ? 'caution' : 'bullish',
      weight: 3,
    });
  }

  // CPI signal
  if (props.cpiYoY !== null && props.cpiYoY !== undefined) {
    const cpi = props.cpiYoY;
    signals.push({
      name: '通货膨胀 (YoY)',
      value: `${cpi.toFixed(1)}%`,
      interpretation: cpi > 4 ? '通胀偏高，联储难以降息' : cpi > 2.5 ? '通胀在目标上方，仍需观察' : cpi > 0 ? '通胀接近目标，货币政策趋于宽松' : '通缩风险，经济或面临压力',
      signal: cpi > 4 ? 'bearish' : cpi > 2.5 ? 'caution' : cpi > 0 ? 'bullish' : 'caution',
      weight: 3,
    });
  }

  // Unemployment signal
  if (props.unemployment !== null && props.unemployment !== undefined) {
    const u = props.unemployment;
    signals.push({
      name: '失业率',
      value: `${u.toFixed(1)}%`,
      interpretation: u < 4 ? '就业强劲，消费支撑股市' : u < 5 ? '就业正常，经济平稳' : u < 7 ? '就业走弱，经济风险上升' : '就业严重恶化，衰退风险高',
      signal: u < 4 ? 'bullish' : u < 5 ? 'neutral' : u < 7 ? 'caution' : 'bearish',
      weight: 2,
    });
  }

  // GDP Growth signal
  if (props.gdpGrowth !== null && props.gdpGrowth !== undefined) {
    const g = props.gdpGrowth;
    signals.push({
      name: 'GDP 增速 (季环比年化)',
      value: `${g.toFixed(1)}%`,
      interpretation: g > 3 ? '经济扩张强劲，企业盈利支撑' : g > 0 ? '经济温和增长，稳健运行' : g > -2 ? '经济收缩，注意风险' : '经济深度衰退',
      signal: g > 3 ? 'bullish' : g > 0 ? 'neutral' : g > -2 ? 'caution' : 'bearish',
      weight: 3,
    });
  }

  // Yield Curve signal
  if (props.yieldSpread !== null && props.yieldSpread !== undefined) {
    const spread = props.yieldSpread;
    signals.push({
      name: '收益率曲线 (10Y-2Y)',
      value: `${spread.toFixed(2)}%`,
      interpretation: spread > 1 ? '曲线陡峭，经济预期乐观' : spread > 0 ? '曲线正常，无即时衰退信号' : spread > -0.5 ? '曲线倒挂，历史衰退预警信号' : '严重倒挂，衰退风险高',
      signal: spread > 1 ? 'bullish' : spread > 0 ? 'neutral' : spread > -0.5 ? 'caution' : 'bearish',
      weight: 3,
    });
  }

  // VIX signal
  if (props.vix !== null && props.vix !== undefined) {
    const vix = props.vix;
    signals.push({
      name: 'VIX 恐慌指数',
      value: vix.toFixed(1),
      interpretation: vix < 15 ? '市场极度乐观，注意回调风险' : vix < 20 ? '市场平静，风险偏好正常' : vix < 30 ? '市场波动加剧，需谨慎' : '恐慌情绪蔓延，但往往是底部区域',
      signal: vix < 15 ? 'caution' : vix < 20 ? 'bullish' : vix < 30 ? 'caution' : 'neutral',
      weight: 2,
    });
  }

  return signals;
}

function getOverallSignal(signals: Signal[]): { label: string; color: string; bg: string; description: string } {
  if (signals.length === 0) return { label: '数据加载中', color: 'text-slate-400', bg: 'bg-slate-700/30', description: '' };

  const scores = signals.map(s => {
    const score = s.signal === 'bullish' ? 1 : s.signal === 'neutral' ? 0 : s.signal === 'caution' ? -0.5 : -1;
    return score * s.weight;
  });
  const totalWeight = signals.reduce((a, b) => a + b.weight, 0);
  const avg = scores.reduce((a, b) => a + b, 0) / totalWeight;

  if (avg > 0.4) return { label: '偏多', color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: '宏观环境整体有利于股市' };
  if (avg > 0.1) return { label: '中性偏多', color: 'text-emerald-300', bg: 'bg-emerald-500/5', description: '宏观条件尚可，但存在局部压力' };
  if (avg > -0.1) return { label: '中性', color: 'text-slate-300', bg: 'bg-slate-700/30', description: '多空信号交织，建议观望' };
  if (avg > -0.4) return { label: '中性偏空', color: 'text-amber-400', bg: 'bg-amber-500/5', description: '宏观压力显现，谨慎操作' };
  return { label: '偏空', color: 'text-red-400', bg: 'bg-red-500/10', description: '宏观环境不利，注意风险' };
}

export default function SignalPanel(props: SignalPanelProps) {
  const signals = computeSignals(props);
  const overall = getOverallSignal(signals);

  const signalConfig = {
    bullish: { label: '利多', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    neutral: { label: '中性', cls: 'bg-slate-700/50 text-slate-400 border-slate-600/30' },
    caution: { label: '注意', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    bearish: { label: '利空', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        宏观信号综合判断
      </h2>

      {/* Overall signal */}
      <div className={`${overall.bg} border border-slate-700/50 rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">综合信号</span>
          <span className={`text-2xl font-bold ${overall.color}`}>{overall.label}</span>
        </div>
        <p className="text-xs text-slate-400">{overall.description}</p>
      </div>

      {/* Individual signals */}
      <div className="space-y-2.5">
        {signals.map(sig => (
          <div key={sig.name} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-slate-300">{sig.name}</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">{sig.value}</span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">{sig.interpretation}</p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${signalConfig[sig.signal].cls}`}>
              {signalConfig[sig.signal].label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-600 border-t border-slate-700/50 pt-3">
        * 以上信号仅供参考，不构成投资建议。历史规律不代表未来表现。
      </p>
    </div>
  );
}
