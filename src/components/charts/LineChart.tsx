'use client';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number | string | null;
  [key: string]: string | number | null | undefined;
}

interface LineChartProps {
  data: DataPoint[];
  dataKey?: string;
  title: string;
  unit?: string;
  color?: string;
  height?: number;
  referenceValue?: number;
  referenceLabel?: string;
  formatValue?: (v: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
  formatValue?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      <div className="text-white font-semibold">
        {formatValue ? formatValue(val) : val?.toFixed(2)}{unit}
      </div>
    </div>
  );
};

export default function LineChart({
  data,
  dataKey = 'value',
  title,
  unit,
  color = '#6366f1',
  height = 180,
  referenceValue,
  referenceLabel,
  formatValue,
}: LineChartProps) {
  const parsedData = data.map(d => ({
    ...d,
    [dataKey]: typeof d[dataKey] === 'string' ? parseFloat(d[dataKey] as string) : d[dataKey],
  }));

  const values = parsedData.map(d => d[dataKey] as number).filter(v => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ReLineChart data={parsedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
            domain={[min - padding, max + padding]}
            tickFormatter={v => formatValue ? formatValue(v) : v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip unit={unit} formatValue={formatValue} />} />
          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: referenceLabel || '', position: 'right', fontSize: 10, fill: '#475569' }}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
