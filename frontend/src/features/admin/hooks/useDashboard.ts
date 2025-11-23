import { useState, useEffect } from 'react';
import { OverviewStats, GrowthMetric } from '../types/dashboard.types';

export function useDashboardData(timeRange: string) {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [growthData, setGrowthData] = useState<GrowthMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [overviewRes, growthRes] = await Promise.all([
                fetch('/api/admin/statistics/overview'),
                fetch(`/api/admin/statistics/growth?days=${timeRange}`),
            ]);

            if (!overviewRes.ok || !growthRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const overviewData = await overviewRes.json();
            const growthDataRes = await growthRes.json();

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

    const exportCSV = async () => {
        try {
            setExporting(true);
            const response = await fetch('/api/admin/statistics/export');

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-statistics-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('Export error:', err);
            alert('Failed to export statistics');
        } finally {
            setExporting(false);
        }
    };

    return {
        exportCSV,
        exporting,
    };
}
