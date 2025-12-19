import { useState, useEffect } from 'react';
import { OverviewStats, GrowthMetric, BookStats } from '../types/dashboard.types';
import { toast } from 'sonner';
import { ViewType } from '@/src/components/admin/dashboard/ViewTypeSelector';
import { NESTJS_STATISTICS_ENDPOINTS, NESTJS_ANALYTICS_ENDPOINTS } from '@/src/constants/server-endpoints';

import clientApi from '@/src/lib/nestjs-client-api';

export function useDashboardData(timeRange: string, viewType: ViewType = 'day') {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [bookStats, setBookStats] = useState<BookStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null); // Using any for now, or define a type if strict
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

            const [overviewRes, growthRes, booksRes, activeUsersRes] = await Promise.all([
                clientApi.get(NESTJS_STATISTICS_ENDPOINTS.overview),
                clientApi.get(`${NESTJS_STATISTICS_ENDPOINTS.growth(Number(timeRange))}&groupBy=${viewType}`),
                clientApi.get(NESTJS_STATISTICS_ENDPOINTS.books),
                clientApi.get(NESTJS_ANALYTICS_ENDPOINTS.getActiveUsers),
            ]);

            const overviewData = overviewRes.data;
            const growthDataRes = growthRes.data;
            const booksDataRes = booksRes.data;
            const activeUsersDataRes = activeUsersRes.data;

            console.log('📊 Dashboard Statistics Debug:', {
                overviewData,
                booksStats: booksDataRes.data,
            });

            setStats(overviewData.data);
            setGrowthData(growthDataRes.data || []);
            setBookStats(booksDataRes.data);
            setAnalytics({ activeUsers: activeUsersDataRes.data });
        } catch (err: any) {
            console.error('Dashboard data fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    return {
        stats,
        bookStats,
        analytics,
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
            let csvContent = 'BÁO CÁO TỔNG HỢP\n';
            csvContent += `Được tạo lúc,${new Date().toLocaleString()}\n`;
            csvContent += `Khoảng thời gian,${days} ngày qua\n\n`;

            csvContent += 'THỐNG KÊ TỔNG QUAN\n';
            csvContent += `Tổng thành viên,${overviewData.users.total}\n`;
            csvContent += `Thành viên hoạt động (30d),${overviewData.users.active}\n`;
            csvContent += `Thành viên mới (Tăng trưởng),${overviewData.users.growth}%\n`;
            csvContent += `Tổng sách,${overviewData.books.total}\n`;
            csvContent += `Tổng chương,${overviewData.books.chapters}\n`;
            csvContent += `Tổng bài viết,${overviewData.posts.total}\n`;
            csvContent += `Tổng bình luận,${overviewData.comments}\n`;
            csvContent += `Tổng đánh giá,${overviewData.reviews}\n\n`;

            // Generate Growth Data Section
            csvContent += 'DỮ LIỆU TĂNG TRƯỞNG HÀNG NGÀY\n';
            csvContent += 'Ngày,Thành viên mới,Sách mới,Bài viết mới\n';
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

            toast.success('Xuất báo cáo thành công');
        } catch (err: any) {
            console.error('Export error:', err);
            toast.error('Không thể xuất thống kê');
        } finally {
            setExporting(false);
        }
    };

    return {
        exportCSV,
        exporting,
    };
}
