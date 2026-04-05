import { useMemo } from 'react';
import {
    useGetOverviewStatsQuery,
    useGetGrowthStatsQuery,
    useGetBookStatsQuery,
    useGetActiveUsersQuery,
} from '../api/analyticsApi';
import { GrowthMetric } from '../types/dashboard.types';
import { ViewType } from '@/components/admin/dashboard/ViewTypeSelector';

export function useDashboardData(timeRange: string, viewType: ViewType = 'day') {
    const days = Number(timeRange);

    const {
        data: overviewData,
        isLoading: isLoadingOverview,
        error: overviewError,
        refetch: refetchOverview,
    } = useGetOverviewStatsQuery();

    const {
        data: growthData = [],
        isLoading: isLoadingGrowth,
        error: growthError,
        refetch: refetchGrowth,
    } = useGetGrowthStatsQuery({ days, groupBy: viewType });

    const {
        data: bookStats,
        isLoading: isLoadingBooks,
        error: booksError,
        refetch: refetchBooks,
    } = useGetBookStatsQuery();

    const {
        data: activeUsersData,
        isLoading: isLoadingActiveUsers,
        error: activeUsersError,
        refetch: refetchActiveUsers,
    } = useGetActiveUsersQuery();

    const loading = isLoadingOverview || isLoadingGrowth || isLoadingBooks || isLoadingActiveUsers;
    const error = overviewError || growthError || booksError || activeUsersError
        ? 'Failed to load dashboard data'
        : null;

    const stats = overviewData ?? null;
    const analytics = useMemo(
        () => ({ activeUsers: activeUsersData }),
        [activeUsersData]
    );
    const growthMetrics: GrowthMetric[] = growthData ?? [];

    const refetch = () => {
        refetchOverview();
        refetchGrowth();
        refetchBooks();
        refetchActiveUsers();
    };

    return {
        stats,
        bookStats,
        analytics,
        growthData: growthMetrics,
        loading,
        error,
        refetch,
    };
}

export function useExportStatistics(timeRange: string = '30') {
    const days = Number(timeRange);

    const { data: growthData = [], isLoading: isLoadingGrowth } = useGetGrowthStatsQuery({
        days,
        groupBy: 'day',
    });
    const { data: overviewData, isLoading: isLoadingOverview } = useGetOverviewStatsQuery();

    const exportCSV = () => {
        if (!growthData || !overviewData) return;

        let csvContent = 'BÁO CÁO TỔNG HỢP\n';
        csvContent += `Được tạo lúc,${new Date().toLocaleString()}\n`;
        csvContent += `Khoảng thời gian,${timeRange} ngày qua\n\n`;

        csvContent += 'THỐNG KÊ TỔNG QUAN\n';
        csvContent += `Tổng thành viên,${overviewData.users.total}\n`;
        csvContent += `Thành viên hoạt động (${timeRange}d),${overviewData.users.active}\n`;
        csvContent += `Thành viên mới (Tăng trưởng),${overviewData.users.growth}%\n`;
        csvContent += `Tổng sách,${overviewData.books.total}\n`;
        csvContent += `Tổng chương,${overviewData.books.chapters}\n`;
        csvContent += `Tổng bài viết,${overviewData.posts.total}\n`;
        csvContent += `Tổng bình luận,${overviewData.comments}\n`;
        csvContent += `Tổng đánh giá,${overviewData.reviews}\n\n`;

        csvContent += 'DỮ LIỆU TĂNG TRƯỞNG HÀNG NGÀY\n';
        csvContent += 'Ngày,Thành viên mới,Sách mới,Bài viết mới\n';
        const rows = growthData
            .map((item) => `${item.date},${item.users},${item.books},${item.posts}`)
            .join('\n');
        csvContent += rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const exporting = isLoadingGrowth || isLoadingOverview;

    return {
        exportCSV,
        exporting,
    };
}
