import { useState, useEffect } from 'react';
import { OverviewStats, GrowthMetric } from '../types/dashboard.types';
import { toast } from 'sonner';
import { ViewType } from '@/src/components/admin/ViewTypeSelector';
import { NESTJS_STATISTICS_ENDPOINTS } from '@/src/constants/server-endpoints';

import clientApi from '@/src/lib/nestjs-client-api';

export function useDashboardData(timeRange: string, viewType: ViewType = 'day') {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [growthData, setGrowthData] = useState<GrowthMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange, viewType]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [overviewRes, growthRes] = await Promise.all([
                clientApi.get(NESTJS_STATISTICS_ENDPOINTS.overview),
                clientApi.get(`${NESTJS_STATISTICS_ENDPOINTS.growth(Number(timeRange))}&groupBy=${viewType}`),
            ]);

            const overviewData = overviewRes.data;
            const growthDataRes = growthRes.data;

            console.log('📊 Dashboard Statistics Debug:', {
                overviewData,
                overviewDataData: overviewData.data,
                booksData: overviewData.data?.books,
                chaptersCount: overviewData.data?.books?.chapters,
            });

            setStats(overviewData.data);
            setGrowthData(growthDataRes.data || []);
        } catch (err: any) {
            console.error('Dashboard data fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    return {
        stats,
        growthData,
        loading,
        error,
        refetch: fetchDashboardData,
    };
}

export function useExportStatistics() {
    const [exporting, setExporting] = useState(false);

    const exportCSV = async (days: string = '30') => {
        try {
            setExporting(true);

            // Fetch both Overview and Growth data
            const [growthRes, overviewRes] = await Promise.all([
                clientApi.get(`${NESTJS_STATISTICS_ENDPOINTS.growth(Number(days))}&groupBy=day`),
                clientApi.get(NESTJS_STATISTICS_ENDPOINTS.overview)
            ]);

            if (!growthRes.data?.data) {
                throw new Error('No growth data received');
            }
            if (!overviewRes.data?.data) {
                throw new Error('No overview data received');
            }

            const growthData: GrowthMetric[] = growthRes.data.data;
            const overviewData: OverviewStats = overviewRes.data.data;

            // Generate Summary Section
            let csvContent = 'SUMMARY REPORT\n';
            csvContent += `Generated at,${new Date().toLocaleString()}\n`;
            csvContent += `Time Range,Last ${days} days\n\n`;

            csvContent += 'OVERVIEW STATISTICS\n';
            csvContent += `Total Users,${overviewData.users.total}\n`;
            csvContent += `Active Users (30d),${overviewData.users.active}\n`;
            csvContent += `New Users (Growth),${overviewData.users.growth}%\n`;
            csvContent += `Total Books,${overviewData.books.total}\n`;
            csvContent += `Total Chapters,${overviewData.books.chapters}\n`;
            csvContent += `Total Posts,${overviewData.posts.total}\n`;
            csvContent += `Total Comments,${overviewData.comments}\n`;
            csvContent += `Total Reviews,${overviewData.reviews}\n\n`;

            // Generate Growth Data Section
            csvContent += 'DAILY GROWTH DATA\n';
            csvContent += 'Date,New Users,New Books,New Posts\n';
            const rows = growthData.map(item =>
                `${item.date},${item.users},${item.books},${item.posts}`
            ).join('\n');
            csvContent += rows;

            // Create Blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-report-${days}days-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Full report exported successfully');
        } catch (err: any) {
            console.error('Export error:', err);
            toast.error('Failed to export statistics');
        } finally {
            setExporting(false);
        }
    };

    return {
        exportCSV,
        exporting,
    };
}
