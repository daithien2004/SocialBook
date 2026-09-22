'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ReadingHeatmapDatum = {
  hour: number | string;
  count: number;
};

export function ReadingHeatmapChart({
  data,
}: {
  data: ReadingHeatmapDatum[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="hour"
          label={{ value: 'Giờ trong ngày', position: 'insideBottom', offset: -5 }}
          stroke="#9ca3af"
        />
        <YAxis
          label={{ value: 'Lượt đọc', angle: -90, position: 'insideLeft' }}
          stroke="#9ca3af"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`hsl(${(Number(entry.hour) / 24) * 360}, 75%, 55%)`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
