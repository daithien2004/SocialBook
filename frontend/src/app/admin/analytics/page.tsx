'use client';

import { useGetReadingHeatmapQuery, useGetChapterEngagementQuery, useGetReadingSpeedQuery, useGetGeographicDistributionQuery, useGetActiveUsersQuery } from '@/src/features/admin/api/analyticsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, TrendingUp, Globe, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import WorldMap from '@/src/components/admin/WorldMap';

export default function AnalyticsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Active Users Counter */}
            <ActiveUsersCard />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReadingHeatmapCard />
                        <ReadingSpeedCard />
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <GeographicCard />
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1">
                    <ChapterEngagementCard />
                </div>
            </div>
        </div>
    );
}

// ============ Active Users Counter Component ============
function ActiveUsersCard() {
    const { data, isLoading, refetch } = useGetActiveUsersQuery();
    const [count, setCount] = useState(0);

    // Animate counter
    useEffect(() => {
        if (data?.count !== undefined) {
            let start = count;
            const end = data.count;
            const duration = 1000;
            const stepTime = 50;
            const steps = duration / stepTime;
            const increment = (end - start) / steps;

            let current = start;
            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.round(current));
                }
            }, stepTime);

            return () => clearInterval(timer);
        }
    }, [data?.count]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 30000);
        return () => clearInterval(interval);
    }, [refetch]);

    return (
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    Active Readers (Live)
                </CardTitle>
                <CardDescription className="text-gray-500">Currently reading in last 5 minutes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading ? (
                    <div className="text-6xl font-bold text-gray-300">--</div>
                ) : (
                    <div className="text-7xl font-bold text-blue-600">{count}</div>
                )}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    <p className="text-sm text-blue-700 font-medium">Live • Updated every 30s</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ============ Reading Heatmap Component ============
function ReadingHeatmapCard() {
    const { data, isLoading, error } = useGetReadingHeatmapQuery();

    return (
        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    Reading Activity Heatmap
                </CardTitle>
                <CardDescription>Reading activity by hour of day</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading && <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>}
                {error && <div className="h-64 flex items-center justify-center text-red-500 font-medium">Error loading data</div>}
                {data && (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} stroke="#9ca3af" />
                            <YAxis label={{ value: 'Readings', angle: -90, position: 'insideLeft' }} stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${(entry.hour / 24) * 360}, 75%, 55%)`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============ Chapter Engagement Component ============
function ChapterEngagementCard() {
    const { data, isLoading, error } = useGetChapterEngagementQuery({ limit: 5 });

    return (
        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    Top Chapters by Engagement
                </CardTitle>
                <CardDescription>Most read chapters with completion rates</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading && <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>}
                {error && <div className="h-64 flex items-center justify-center text-red-500 font-medium">Error loading data</div>}
                {data && data.length === 0 && <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>}
                {data && data.length > 0 && (
                    <div className="space-y-4">
                        {data.map((chapter, idx) => (
                            <div key={chapter.chapterId} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-gray-900">{chapter.chapterTitle}</p>
                                        <p className="text-xs text-gray-500 mt-1">{chapter.bookTitle}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-bold text-gray-900">{chapter.viewCount}</p>
                                        <p className="text-xs text-gray-500">views</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${chapter.completionRate}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{chapter.completionRate}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============ Reading Speed Component ============
function ReadingSpeedCard() {
    const { data, isLoading, error } = useGetReadingSpeedQuery({ days: 7 });

    return (
        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    Reading Speed Trend
                </CardTitle>
                <CardDescription>Average reading speed (words per minute)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading && <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>}
                {error && <div className="h-64 flex items-center justify-center text-red-500 font-medium">Error loading data</div>}
                {data && data.length === 0 && <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>}
                {data && data.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#9ca3af" />
                            <YAxis label={{ value: 'WPM', angle: -90, position: 'insideLeft' }} stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="averageSpeed" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============ Geographic Distribution Component ============
function GeographicCard() {
    const { data, isLoading, error } = useGetGeographicDistributionQuery();

    return (
        <Card className="col-span-1 lg:col-span-2 bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-cyan-50 rounded-lg">
                        <Globe className="h-5 w-5 text-cyan-600" />
                    </div>
                    Geographic Distribution
                </CardTitle>
                <CardDescription>Readers by country (Interactive Map)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading && <div className="h-[400px] flex items-center justify-center text-gray-400">Loading...</div>}
                {error && <div className="h-[400px] flex items-center justify-center text-red-500 font-medium">Error loading data</div>}
                {data && (
                    <div className="w-full">
                        <WorldMap data={data} />
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {data.slice(0, 4).map((country, idx) => (
                                <div key={idx} className="flex flex-col items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
                                    <span className="font-semibold text-sm text-gray-900">{country.country}</span>
                                    <span className="text-sm font-bold bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full mt-2">{country.userCount} users</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}