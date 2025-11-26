import { useState, useEffect } from 'react';
import { OverviewStats, GrowthMetric } from '../types/dashboard.types';
import { toast } from 'sonner';
import { ViewType } from '@/src/components/admin/ViewTypeSelector';

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
                fetch('/api/admin/statistics/overview'),
                fetch(`/api/admin/statistics/growth?days=${timeRange}&groupBy=${viewType}`),
            ]);

            if (!overviewRes.ok || !growthRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const overviewData = await overviewRes.json();
            const growthDataRes = await growthRes.json();

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
            const response = await fetch(`/api/admin/statistics/export?days=${days}`);

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-statistics-${days}days-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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
