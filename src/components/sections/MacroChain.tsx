'use client';

import { ArrowRight, ArrowDown } from 'lucide-react';

// Visualizes how macro indicators chain together to drive stock prices
// Designed for retail investors with no econ background

interface NodeProps {
  title: string;
  subtitle?: string;
  variant?: 'input' | 'policy' | 'transmission' | 'output';
}

function Node({ title, subtitle, variant = 'input' }: NodeProps) {
  const variantCls = {
    input: 'bg-slate-800/80 border-slate-600/60 text-slate-200',
    policy: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300',
    transmission: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
    output: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
  }[variant];
  return (
    <div className={`border rounded-lg px-3 py-2 text-center min-w-[88px] ${variantCls}`}>
      <div className="text-xs font-semibold leading-tight">{title}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{subtitle}</div>}
    </div>
  );
}

function Arrow({ label, vertical = false }: { label?: string; vertical?: boolean }) {
  return (
    <div className={`flex items-center gap-1 text-slate-500 ${vertical ? 'flex-col py-1' : 'px-1'}`}>
      {vertical ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
      {label && <span className="text-[10px] text-slate-600 whitespace-nowrap">{label}</span>}
    </div>
  );
}

export default function MacroChain() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">🔗 宏观传导链：从经济数据到股价</h3>
      <p className="text-xs text-slate-500 mb-4">
        宏观指标不是孤立的——它们环环相扣，共同决定美股的走势。理解这条链，比记住每个数字本身更重要。
      </p>

      {/* Layer 1: Inputs (data) */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">① 经济数据（输入）</div>
        <div className="flex flex-wrap items-center gap-2">
          <Node title="CPI / PCE" subtitle="通胀压力" />
          <Node title="失业率 / 初请" subtitle="就业状况" />
          <Node title="GDP / 零售" subtitle="经济活力" />
          <Node title="消费者信心" subtitle="预期" />
        </div>
      </div>

      <div className="flex justify-center"><Arrow label="联储据此决策" vertical /></div>

      {/* Layer 2: Fed Policy */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">② 美联储政策</div>
        <div className="flex flex-wrap items-center gap-2">
          <Node title="联邦基金利率" subtitle="加息 / 降息" variant="policy" />
          <Node title="缩表 / 扩表" subtitle="QT / QE" variant="policy" />
          <Arrow />
          <Node title="点阵图 / 表态" subtitle="前瞻指引" variant="policy" />
        </div>
      </div>

      <div className="flex justify-center"><Arrow label="传导到金融市场" vertical /></div>

      {/* Layer 3: Transmission */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">③ 利率传导</div>
        <div className="flex flex-wrap items-center gap-2">
          <Node title="2Y 短期国债" subtitle="跟随政策利率" variant="transmission" />
          <Arrow />
          <Node title="10Y 长期国债" subtitle="折现率基准" variant="transmission" />
          <Arrow />
          <Node title="收益率曲线" subtitle="衰退预警" variant="transmission" />
        </div>
      </div>

      <div className="flex justify-center"><Arrow label="影响估值与盈利" vertical /></div>

      {/* Layer 4: Stock Market */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">④ 美股</div>
        <div className="flex flex-wrap items-center gap-2">
          <Node title="折现率↑→估值↓" subtitle="P/E 收缩" variant="output" />
          <Arrow />
          <Node title="盈利预期" subtitle="GDP 决定 EPS" variant="output" />
          <Arrow />
          <Node title="VIX 情绪" subtitle="风险溢价" variant="output" />
          <Arrow />
          <Node title="S&P / 纳指 / 道指" subtitle="最终价格" variant="output" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-emerald-400 font-semibold mb-1">✅ 利好链路（典型）</div>
          <p className="text-slate-400 leading-relaxed">
            通胀回落 → 联储暗示降息 → 10Y 收益率↓ → 折现率↓ → 估值↑ → 成长股大涨
          </p>
        </div>
        <div>
          <div className="text-red-400 font-semibold mb-1">❌ 利空链路（典型）</div>
          <p className="text-slate-400 leading-relaxed">
            通胀超预期 → 联储更鹰 → 10Y 收益率↑ → 折现率↑ → 高估值股票（科技）首当其冲
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 rounded-lg px-3 py-2 leading-relaxed">
        <span className="text-amber-400">💡 关键认知：</span>
        市场是<strong className="text-slate-300">&ldquo;预期&rdquo;</strong>的游戏。等到数据公布时，价格通常已经反映完毕。
        关注点不应是&ldquo;现在的数据是多少&rdquo;，而是&ldquo;数据相比市场预期是好还是坏&rdquo;。
      </div>
    </div>
  );
}
