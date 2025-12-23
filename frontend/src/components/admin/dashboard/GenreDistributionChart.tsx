'use client';

import { BookStats } from '@/src/features/admin/types/dashboard.types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface GenreDistributionChartProps {
    genres: BookStats['byGenre'];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export function GenreDistributionChart({ genres }: GenreDistributionChartProps) {
    // Sort by count and probably take top X + "Others" if too many, but for now just all
    // Filter out 0 counts if any
    const data = genres.filter(g => g.count > 0).sort((a, b) => b.count - a.count);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Phân Bố Thể Loại</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="genres"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                color: '#1f2937'
                            }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
