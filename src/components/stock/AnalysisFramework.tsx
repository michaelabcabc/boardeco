'use client';

// Visual flow showing how the page sections connect.
// "为什么先看这个，再看那个" — gives the reader a mental model
// instead of a list of disconnected metrics.

interface Step {
  num: string;
  title: string;
  question: string;
  answer: string;
  cls: string;
  anchor: string;
}

const STEPS: Step[] = [
  {
    num: '①',
    title: '商业质量',
    question: '它能持续赚钱吗？',
    answer: '高毛利、高 ROE = 有护城河',
    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    anchor: '#sec-quality',
  },
  {
    num: '②',
    title: '成长性',
    question: '生意在变大还是萎缩？',
    answer: '营收/盈利 YoY、FCF 趋势',
    cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    anchor: '#sec-growth',
  },
  {
    num: '③',
    title: '财务健康',
    question: '衰退期能扛得住吗？',
    answer: '现金、债务、流动性',
    cls: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    anchor: '#sec-health',
  },
  {
    num: '④',
    title: '估值',
    question: '现在贵不贵？',
    answer: '多种方法交叉验证',
    cls: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
    anchor: '#sec-valuation',
  },
  {
    num: '⑤',
    title: '安全边际',
    question: '现价相对内在价值有多少折扣？',
    answer: 'DCF 估算 vs 当前价',
    cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    anchor: '#sec-dcf',
  },
];

export default function AnalysisFramework() {
  return (
    <section className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-bold text-slate-100 mb-1">🧭 分析框架地图</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        每一步是下一步的<strong className="text-slate-200">前提</strong>：先确认这是不是一门好生意（①②③），再判断价格合不合理（④⑤）。
        生意烂、价格再低也是&ldquo;价值陷阱&rdquo;；生意好但价格太贵，未来回报率会被估值压缩。
      </p>

      {/* Desktop: horizontal flow */}
      <div className="hidden md:flex items-stretch gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-stretch flex-1 min-w-0">
            <a
              href={s.anchor}
              className={`flex-1 border ${s.cls} rounded-lg p-3 transition-all hover:scale-[1.02] hover:brightness-125 cursor-pointer min-w-0`}
            >
              <div className="text-xs font-bold mb-0.5">{s.num} {s.title}</div>
              <div className="text-[11px] text-slate-300 leading-tight mb-1">{s.question}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{s.answer}</div>
            </a>
            {i < STEPS.length - 1 && (
              <div className="flex items-center px-1 text-slate-600">→</div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden space-y-2">
        {STEPS.map(s => (
          <a
            key={s.num}
            href={s.anchor}
            className={`block border ${s.cls} rounded-lg p-3`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs font-bold">{s.num} {s.title}</div>
              <div className="text-[10px] text-slate-500">{s.answer}</div>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">{s.question}</div>
          </a>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/40 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-300">关键提醒：</strong>
        定量数据（P/E、ROE 等）告诉你<span className="text-slate-300">&ldquo;过去和现状&rdquo;</span>；
        定性研究（商业模式、竞争格局、管理层）才能告诉你<span className="text-slate-300">&ldquo;未来&rdquo;</span>。
        本页只覆盖前者 — 真正的研究还需要读年报、电话会议、行业分析。
      </div>
    </section>
  );
}
