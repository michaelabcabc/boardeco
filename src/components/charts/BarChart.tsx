'use client';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number | string | null;
}

interface BarChartProps {
  data: DataPoint[];
  title: string;
  unit?: string;
  positiveColor?: string;
  negativeColor?: string;
  height?: number;
  referenceValue?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      <div className={`font-semibold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val > 0 ? '+' : ''}{val?.toFixed(2)}{unit}
      </div>
    </div>
  );
};

export default function BarChart({
  data,
  title,
  unit,
  positiveColor = '#10b981',
  negativeColor = '#ef4444',
  height = 180,
  referenceValue = 0,
}: BarChartProps) {
  const parsedData = data.map(d => ({
    ...d,
    value: typeof d.value === 'string' ? parseFloat(d.value) : d.value,
  }));

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={parsedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={d => d?.slice(0, 7) || d}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v.toFixed(1)}`}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <ReferenceLine y={referenceValue} stroke="#334155" />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {parsedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(entry.value as number) >= referenceValue ? positiveColor : negativeColor}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
