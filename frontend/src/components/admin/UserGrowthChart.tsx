'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ViewType } from './ViewTypeSelector';

interface GrowthData {
  date: string;
  users: number;
  books: number;
  posts: number;
}

interface UserGrowthChartProps {
  data: GrowthData[];
  viewType: ViewType;
  timeRange: string;
}

export function UserGrowthChart({
  data,
  viewType,
  timeRange,
}: UserGrowthChartProps) {
  // Generate dynamic title
  const getTitle = () => {
    const rangeNum = parseInt(timeRange, 10);

    switch (viewType) {
      case 'month':
        const months = Math.round(rangeNum / 30);
        return `Growth Metrics (Last ${months} Month${months > 1 ? 's' : ''})`;
      case 'year':
        const years = Math.round(rangeNum / 365);
        return `Growth Metrics (Last ${years} Year${years > 1 ? 's' : ''})`;
      case 'day':
      default:
        return `Growth Metrics (Last ${rangeNum} Day${
          rangeNum > 1 ? 's' : ''
        })`;
    }
  };

  // Format date based on view type
  const formatDate = (value: string) => {
    switch (viewType) {
      case 'month':
        // "2025-11" -> "Nov 2025"
        const [year, month] = value.split('-');
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
      case 'year':
        // "2025" -> "2025"
        return value;
      case 'day':
      default:
        // "2025-11-26" -> "11/26"
        const date = new Date(value);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{getTitle()}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={formatDate}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelFormatter={formatDate}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#6366f1"
            strokeWidth={2}
            name="Users"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="books"
            stroke="#10b981"
            strokeWidth={2}
            name="Books"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="posts"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Posts"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
