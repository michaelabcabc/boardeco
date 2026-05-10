'use client';

// Estimates current US business cycle phase from a few key indicators
// and shows what to expect from US stocks in each phase.

interface CyclePhaseProps {
  fedRate?: number | null;
  cpiYoY?: number | null;
  unemployment?: number | null;
  yieldSpread?: number | null;
  gdpGrowth?: number | null;
}

type Phase = 'expansion' | 'late-cycle' | 'recession' | 'recovery';

interface PhaseInfo {
  key: Phase;
  label: string;
  emoji: string;
  cls: string;
  characteristics: string;
  stocks: string;
  bestSectors: string;
  worstSectors: string;
}

const PHASES: Record<Phase, PhaseInfo> = {
  expansion: {
    key: 'expansion',
    label: '扩张期',
    emoji: '🟢',
    cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    characteristics: 'GDP 稳健增长 · 就业改善 · 通胀温和 · 利率中性',
    stocks: '股市趋势上行，盈利驱动估值，风险偏好高',
    bestSectors: '科技、可选消费、工业、金融',
    worstSectors: '必选消费、公用事业（防御板块跑输）',
  },
  'late-cycle': {
    key: 'late-cycle',
    label: '过热 / 周期末期',
    emoji: '🟡',
    cls: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    characteristics: '通胀升温 · 就业过热 · 联储加息 · 收益率曲线趋平/倒挂',
    stocks: '估值受压，市场震荡加剧，VIX 抬升',
    bestSectors: '能源、原材料、医疗（抗通胀 + 防御）',
    worstSectors: '高估值科技、长债 (TLT)、房地产 (XLRE)',
  },
  recession: {
    key: 'recession',
    label: '衰退期',
    emoji: '🔴',
    cls: 'bg-red-500/10 border-red-500/30 text-red-300',
    characteristics: '失业率攀升 · GDP 收缩 · 联储开始降息 · 信用利差走阔',
    stocks: '股市下跌，盈利下修，资金流向避险资产',
    bestSectors: '必选消费、医疗、公用事业、长债 (TLT)',
    worstSectors: '可选消费、能源、金融、小盘股 (Russell)',
  },
  recovery: {
    key: 'recovery',
    label: '复苏期',
    emoji: '🟢',
    cls: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    characteristics: '通胀回落 · 联储宽松 · 失业率见顶 · 收益率曲线变陡',
    stocks: '股市强势反弹，估值修复，成长股领涨',
    bestSectors: '科技、可选消费、金融、小盘股 (Russell 2000)',
    worstSectors: '防御板块、长债（再通胀预期）',
  },
};

function inferPhase(p: CyclePhaseProps): { phase: Phase; confidence: 'high' | 'mid' | 'low'; reasoning: string[] } {
  const reasoning: string[] = [];
  const scores: Record<Phase, number> = { expansion: 0, 'late-cycle': 0, recession: 0, recovery: 0 };

  if (p.cpiYoY != null) {
    if (p.cpiYoY > 4) { scores['late-cycle'] += 2; reasoning.push(`通胀 ${p.cpiYoY.toFixed(1)}% 偏高 → 过热信号`); }
    else if (p.cpiYoY > 2.5) { scores['late-cycle'] += 1; scores.expansion += 1; reasoning.push(`通胀 ${p.cpiYoY.toFixed(1)}% 在目标上方`); }
    else if (p.cpiYoY > 1.5) { scores.expansion += 2; scores.recovery += 1; reasoning.push(`通胀 ${p.cpiYoY.toFixed(1)}% 接近目标 → 健康`); }
    else { scores.recovery += 1; scores.recession += 1; reasoning.push(`通胀 ${p.cpiYoY.toFixed(1)}% 偏低 → 需求疲弱`); }
  }

  if (p.unemployment != null) {
    if (p.unemployment < 4) { scores['late-cycle'] += 2; scores.expansion += 1; reasoning.push(`失业率 ${p.unemployment.toFixed(1)}% 偏紧 → 劳动力市场过热`); }
    else if (p.unemployment < 5) { scores.expansion += 2; reasoning.push(`失业率 ${p.unemployment.toFixed(1)}% 健康`); }
    else if (p.unemployment < 6) { scores.recovery += 1; scores.recession += 1; reasoning.push(`失业率 ${p.unemployment.toFixed(1)}% 走升 → 警惕`); }
    else { scores.recession += 2; reasoning.push(`失业率 ${p.unemployment.toFixed(1)}% 偏高 → 衰退迹象`); }
  }

  if (p.yieldSpread != null) {
    if (p.yieldSpread < -0.3) { scores['late-cycle'] += 2; scores.recession += 1; reasoning.push(`收益率曲线倒挂 ${p.yieldSpread.toFixed(2)}% → 历史衰退预警`); }
    else if (p.yieldSpread < 0.3) { scores['late-cycle'] += 1; reasoning.push(`收益率曲线平坦 ${p.yieldSpread.toFixed(2)}% → 周期偏后段`); }
    else if (p.yieldSpread > 1.5) { scores.recovery += 2; scores.expansion += 1; reasoning.push(`收益率曲线陡峭 ${p.yieldSpread.toFixed(2)}% → 复苏 / 扩张`); }
    else { scores.expansion += 1; }
  }

  if (p.gdpGrowth != null) {
    if (p.gdpGrowth < 0) { scores.recession += 2; reasoning.push(`GDP ${p.gdpGrowth.toFixed(1)}% 收缩`); }
    else if (p.gdpGrowth < 1.5) { scores.recovery += 1; scores['late-cycle'] += 1; reasoning.push(`GDP ${p.gdpGrowth.toFixed(1)}% 放缓`); }
    else if (p.gdpGrowth < 3) { scores.expansion += 2; reasoning.push(`GDP ${p.gdpGrowth.toFixed(1)}% 健康增长`); }
    else { scores.expansion += 1; scores['late-cycle'] += 1; reasoning.push(`GDP ${p.gdpGrowth.toFixed(1)}% 强劲`); }
  }

  if (p.fedRate != null) {
    if (p.fedRate > 5) { scores['late-cycle'] += 1; reasoning.push(`联储利率 ${p.fedRate.toFixed(2)}% 偏高 → 抑制周期`); }
    else if (p.fedRate < 2) { scores.recovery += 1; reasoning.push(`联储利率 ${p.fedRate.toFixed(2)}% 偏低 → 刺激经济`); }
  }

  // Pick max
  const sorted = (Object.entries(scores) as [Phase, number][]).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0];
  const gap = sorted[0][1] - sorted[1][1];
  const confidence: 'high' | 'mid' | 'low' = gap >= 2 ? 'high' : gap >= 1 ? 'mid' : 'low';

  return { phase: top, confidence, reasoning };
}

export default function CyclePhase(props: CyclePhaseProps) {
  const { phase, confidence, reasoning } = inferPhase(props);
  const info = PHASES[phase];
  const allPhases: Phase[] = ['recovery', 'expansion', 'late-cycle', 'recession'];

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">🕐 当前经济周期阶段（推断）</h3>
      <p className="text-xs text-slate-500 mb-4">
        基于通胀、就业、收益率曲线、GDP 综合判断。<span className="text-slate-600">注：仅为定性参考。</span>
      </p>

      {/* Cycle stages timeline */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {allPhases.map(p => {
          const pi = PHASES[p];
          const active = p === phase;
          return (
            <div
              key={p}
              className={`text-center px-2 py-2 rounded-lg border transition-all ${
                active ? pi.cls + ' ring-2 ring-offset-2 ring-offset-slate-800' : 'bg-slate-900/40 border-slate-700/40 text-slate-500'
              }`}
            >
              <div className="text-base">{pi.emoji}</div>
              <div className="text-[10px] sm:text-xs font-semibold mt-0.5">{pi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Current phase detail */}
      <div className={`border rounded-xl p-4 ${info.cls}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold">
            {info.emoji} 当前阶段：{info.label}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900/40 text-slate-300">
            置信度：{confidence === 'high' ? '高' : confidence === 'mid' ? '中' : '低'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
          <div>
            <div className="text-slate-400 mb-1">📋 特征</div>
            <p className="text-slate-200 leading-relaxed">{info.characteristics}</p>
          </div>
          <div>
            <div className="text-slate-400 mb-1">📈 美股表现</div>
            <p className="text-slate-200 leading-relaxed">{info.stocks}</p>
          </div>
          <div>
            <div className="text-slate-400 mb-1">✅ 通常领涨</div>
            <p className="text-emerald-300 leading-relaxed">{info.bestSectors}</p>
          </div>
          <div>
            <div className="text-slate-400 mb-1">❌ 通常承压</div>
            <p className="text-red-300 leading-relaxed">{info.worstSectors}</p>
          </div>
        </div>
      </div>

      {reasoning.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          <span className="text-slate-400">推断依据：</span>
          {reasoning.join(' · ')}
        </div>
      )}
    </div>
  );
}
