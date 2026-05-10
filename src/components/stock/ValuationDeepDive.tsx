'use client';

import ValuationMethod from './ValuationMethod';
import {
  classifyPE, classifyPB, classifyPS, classifyPEG,
} from './format';

interface F {
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  priceToSalesTrailing12Months?: number;
  pegRatio?: number;
  enterpriseToEbitda?: number;
  trailingEps?: number;
  forwardEps?: number;
  bookValue?: number;
  totalRevenue?: number;
  marketCap?: number;
  enterpriseValue?: number;
  ebitda?: number;
  sector?: string;
  earningsGrowth?: number;
}

const fmt = (v?: number, d = 2) => v == null || isNaN(v) ? null : v.toFixed(d);

export default function ValuationDeepDive({ f }: { f: F }) {
  const peCls = classifyPE(f.trailingPE);
  const fpeCls = classifyPE(f.forwardPE);
  const pbCls = classifyPB(f.priceToBook);
  const psCls = classifyPS(f.priceToSalesTrailing12Months);
  const pegCls = classifyPEG(f.pegRatio);

  // Forward vs trailing PE delta — useful comparison signal
  const peDelta = (f.trailingPE != null && f.forwardPE != null)
    ? ((f.forwardPE - f.trailingPE) / f.trailingPE) * 100
    : null;

  return (
    <div className="space-y-3">
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-200">怎么读这一节：</strong>
        没有任何单一估值指标是&ldquo;正确&rdquo;的。每种方法都有<span className="text-amber-300">特定的盲区</span>。
        实践中要<strong className="text-slate-200">交叉验证</strong> — 多个方法都说&ldquo;贵&rdquo;才更可信。
        每张卡片下面专门列了&ldquo;<span className="text-emerald-400">考虑了什么</span>&rdquo; vs &ldquo;<span className="text-red-400">没考虑什么</span>&rdquo;。
      </div>

      {/* P/E (Trailing) */}
      <ValuationMethod
        emoji="📐"
        name="P/E（市盈率，TTM）"
        formula="股价 ÷ 过去 12 个月每股盈利"
        currentValue={fmt(f.trailingPE)}
        tag={peCls.tag !== '—' ? { label: peCls.tag, tone: peCls.tone } : undefined}
        oneLiner="最常用的估值指标 — 你愿意为公司过去 1 美元盈利支付多少钱？P/E = 25 表示市场要求 25 年回本（理论上，假设盈利不变）。"
        bestFor="盈利稳定的成熟公司、行业平均水平相对统一时（如消费、工业）"
        pitfalls={[
          '完全后视镜 — 不反映任何未来',
          '不适合周期股（盈利波动巨大，山顶 P/E 反而最低）',
          '不适合亏损公司（P/E 为负或无意义）',
          '不考虑负债结构（高杠杆公司 P/E 看似便宜但风险高）',
          '会计处理影响大（一次性收益/损失会扭曲）',
        ]}
        thresholds={[
          { range: '< 15', meaning: '便宜 — 但要排除&ldquo;便宜的烂公司&rdquo;（价值陷阱）', tone: 'good' },
          { range: '15 - 25', meaning: '合理 — S&P 500 长期均值约 16-18', tone: 'good' },
          { range: '25 - 40', meaning: '偏贵 — 需要高增长支撑', tone: 'warn' },
          { range: '> 40', meaning: '高估 — 增长必须非常强且持续', tone: 'bad' },
          { range: '< 0', meaning: '亏损公司 — P/E 不适用，看 P/S 或 EV/EBITDA', tone: 'neutral' },
        ]}
      />

      {/* Forward P/E */}
      <ValuationMethod
        emoji="🔮"
        name="Forward P/E（前瞻市盈率）"
        formula="股价 ÷ 分析师对未来 12 个月每股盈利的预期"
        currentValue={fmt(f.forwardPE)}
        tag={fpeCls.tag !== '—' ? { label: fpeCls.tag, tone: fpeCls.tone } : undefined}
        oneLiner="把分母换成&ldquo;预期未来盈利&rdquo;。理论上比 TTM P/E 更&ldquo;前瞻&rdquo;，因为股价本来就是看未来。但代价是：依赖分析师预测，而分析师常常错。"
        considers={[
          '分析师对未来 4 个季度 EPS 的共识',
          '管理层最近一次的指引（guidance）',
          '已公布的近期催化剂（新产品、价格调整）',
        ]}
        ignores={[
          '分析师预测的<strong>系统性偏差</strong>：通常过于乐观（研究显示比实际高 10-20%）',
          '宏观突变（衰退、地缘冲突）— 数据滚动更新很慢',
          '只看 1 年 — 不关心 2-5 年的成长曲线',
          '估值倍数本身的变化（如果市场对该公司的&ldquo;愿付倍数&rdquo;下移，Forward P/E 也会失效）',
          '商业模式变化（AI 替代、监管打击）',
        ]}
        bestFor="盈利可预测性强的行业（消费、医药、公用事业）、最近无重大业务变化的公司"
        pitfalls={[
          '<strong>分析师乐观偏差</strong>：经济转差时下修往往滞后',
          '比 TTM 更敏感于&ldquo;预期 vs 实际&rdquo;的差距 — 一次财报不及预期就崩',
          '盲信会导致&ldquo;Buy the rumor&rdquo;陷阱',
        ]}
        thresholds={[
          { range: '< Trailing P/E', meaning: '盈利在加速 — 利好（如果预期靠谱）', tone: 'good' },
          { range: '≈ Trailing P/E', meaning: '盈利稳定', tone: 'good' },
          { range: '> Trailing P/E', meaning: '盈利预期下滑 — 警惕', tone: 'warn' },
        ]}
        note={
          peDelta != null ? (
            <span>
              <strong className="text-slate-300">本案 Forward 比 Trailing {peDelta > 0 ? '高' : '低'} {Math.abs(peDelta).toFixed(1)}%</strong> —
              {peDelta < -10 ? '强烈意味着分析师预期盈利大幅增长。' :
               peDelta < 0 ? '盈利预期温和上行。' :
               peDelta < 10 ? '盈利预期略下调，留意。' : '分析师在下调预期，警惕。'}
            </span>
          ) : null
        }
      />

      {/* PEG */}
      <ValuationMethod
        emoji="📈"
        name="PEG（PE 与增长率之比）"
        formula="Forward P/E ÷ 预期 EPS 增长率（百分数）"
        currentValue={fmt(f.pegRatio)}
        tag={pegCls.tag !== '—' ? { label: pegCls.tag, tone: pegCls.tone } : undefined}
        oneLiner="Peter Lynch 的经典指标：把估值和增长放进同一个数。PEG = 1 表示&ldquo;P/E 数字 = 增长百分数&rdquo;，被认为合理。"
        considers={[
          '近 1-5 年 EPS 增长预期',
          'Forward P/E 中的盈利信息',
        ]}
        ignores={[
          '增长的<strong>持续性</strong> — 5 年增长 30% 比 1 年增长 30% 价值高得多',
          '增长的<strong>质量</strong> — 烧钱补贴推出来的增长 vs 利润率扩张推出来的增长',
          '估值乘数本身的<strong>合理性</strong> — 如果市场情绪改变，倍数会重估',
          '资本回报率（ROE）— 高 ROE 公司每单位增长价值更高',
        ]}
        bestFor="高增长成长股（科技、消费成长）"
        pitfalls={[
          '不适合周期股 — 增长率波动大',
          '不适合极慢增长 / 负增长公司（PEG 公式失效）',
          '5 年期预测高度不靠谱',
          '可能被&ldquo;增长率&rdquo;的统计口径操纵',
        ]}
        thresholds={[
          { range: '< 1.0', meaning: '增长能撑起估值 — Lynch 的经典买点', tone: 'good' },
          { range: '1.0 - 1.5', meaning: '合理', tone: 'good' },
          { range: '1.5 - 2.0', meaning: '增长跟得上但留意持续性', tone: 'warn' },
          { range: '> 2.0', meaning: '增长撑不起估值', tone: 'bad' },
        ]}
      />

      {/* P/B */}
      <ValuationMethod
        emoji="🏦"
        name="P/B（市净率）"
        formula="股价 ÷ 每股净资产（账面价值）"
        currentValue={fmt(f.priceToBook)}
        tag={pbCls.tag !== '—' ? { label: pbCls.tag, tone: pbCls.tone } : undefined}
        oneLiner="如果今天清盘，账面上每股有多少资产支撑你的股价？银行、保险、REIT 的标准估值方法。"
        bestFor="重资产行业 — 银行、保险、地产、能源、制造业"
        pitfalls={[
          '<strong>不适合轻资产公司</strong>（科技、服务、品牌驱动）—无形资产、品牌、IP 不计入账面',
          '账面价值受会计政策影响（折旧方法、减值时机）',
          '回购大量股票的公司账面权益会很低，P/B 看起来很高（如苹果）',
        ]}
        thresholds={[
          { range: '< 1.0', meaning: '股价低于账面 — 银行/保险/资产公司的买点', tone: 'good' },
          { range: '1.0 - 3.0', meaning: '合理', tone: 'good' },
          { range: '3.0 - 6.0', meaning: '偏贵', tone: 'warn' },
          { range: '> 6.0', meaning: '很贵 — 但科技股常年这样', tone: 'bad' },
        ]}
        note={
          f.sector === 'Technology' || f.sector === 'Communication Services' ? (
            <span><strong className="text-amber-300">本公司属于 {f.sector}</strong>：P/B 在轻资产行业意义有限，建议优先看 P/E、P/S、PEG。</span>
          ) : null
        }
      />

      {/* P/S */}
      <ValuationMethod
        emoji="💸"
        name="P/S（市销率）"
        formula="股价 ÷ 每股营收（市值 ÷ 营收）"
        currentValue={fmt(f.priceToSalesTrailing12Months)}
        tag={psCls.tag !== '—' ? { label: psCls.tag, tone: psCls.tone } : undefined}
        oneLiner="完全绕开盈利，只看营收。亏损或盈利波动巨大的公司用得最多。"
        bestFor="早期成长股、SaaS 软件、未盈利的互联网公司、转型期公司"
        pitfalls={[
          '<strong>完全忽略盈利能力</strong> — 高营收 + 永远不盈利的公司很常见',
          '不同行业 P/S 不可比（软件 10 倍正常，零售 0.5 倍正常）',
          '可能被会计处理&ldquo;充收入&rdquo;扭曲',
        ]}
        thresholds={[
          { range: '< 2', meaning: '便宜 — 但要看是不是低利润率行业', tone: 'good' },
          { range: '2 - 6', meaning: '合理（消费/工业一般在此区间）', tone: 'good' },
          { range: '6 - 12', meaning: '偏贵（高利润率软件常在此）', tone: 'warn' },
          { range: '> 12', meaning: '泡沫区（除非是顶级 SaaS）', tone: 'bad' },
        ]}
      />

      {/* EV / EBITDA */}
      <ValuationMethod
        emoji="🏗️"
        name="EV / EBITDA"
        formula="企业价值（市值+净负债）÷ 息税折旧摊销前利润"
        currentValue={fmt(f.enterpriseToEbitda)}
        oneLiner="并购交易的标准估值法。&ldquo;假如要全资收购这家公司，需要付多少倍 EBITDA？&rdquo;"
        considers={[
          '股本 + 负债的全部资本（市值 + 净债务）',
          '主业现金生成能力（剔除税、利息、非现金折旧）',
          '不同资本结构的公司可比',
        ]}
        ignores={[
          '资本支出（CapEx）— 重资产公司的&ldquo;真实&rdquo;现金流远低于 EBITDA',
          '营运资本变化',
          '税收差异（不同国家、不同行业税率不同）',
          '股权激励（SBC）— 软件公司这一项常常巨大',
        ]}
        bestFor="并购估值、跨资本结构对比、能源/电信等重资产行业"
        pitfalls={[
          '<strong>EBITDA 不是现金流</strong>（巴菲特说&ldquo;EBITDA 是个骗人的指标&rdquo;）',
          '在科技公司，把 SBC 加回 EBITDA 等于&ldquo;免费的稀释&rdquo;',
          '6-12 倍是常见区间，但软件常 20-40 倍',
        ]}
        thresholds={[
          { range: '< 6', meaning: '便宜（典型重工业、传统能源）', tone: 'good' },
          { range: '6 - 12', meaning: '合理', tone: 'good' },
          { range: '12 - 20', meaning: '偏贵', tone: 'warn' },
          { range: '> 20', meaning: '很贵（除非高毛利软件）', tone: 'bad' },
        ]}
      />
    </div>
  );
}
