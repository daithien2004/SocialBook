'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface GrowthData {
    date: string;
    users: number;
    books: number;
    posts: number;
}

interface UserGrowthChartProps {
    data: GrowthData[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Growth Metrics (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px',
                        }}
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
