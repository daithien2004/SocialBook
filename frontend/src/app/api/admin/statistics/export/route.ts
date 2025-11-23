import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { NESTJS_STATISTICS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

const forbiddenResponse = NextResponse.json(
    {
        success: false,
        statusCode: 403,
        message: 'Forbidden - Admin access required',
        error: 'Forbidden',
    },
    { status: 403 },
);

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const authenticatedApi = await getAuthenticatedServerApi();

        // Fetch statistics from backend
        const [overviewRes, growthRes] = await Promise.all([
            authenticatedApi.get(NESTJS_STATISTICS_ENDPOINTS.overview),
            authenticatedApi.get(NESTJS_STATISTICS_ENDPOINTS.growth(30)),
        ]);

        const overviewData = overviewRes.data.data;
        const growthData = growthRes.data.data;

        // Create CSV content
        const csvRows = [];

        // Overview section
        csvRows.push('OVERVIEW STATISTICS');
        csvRows.push('Metric,Value');
        csvRows.push(`Total Users,${overviewData.users.total}`);
        csvRows.push(`Active Users (30d),${overviewData.users.active}`);
        csvRows.push(`Banned Users,${overviewData.users.banned}`);
        csvRows.push(`User Growth %,${overviewData.users.growth}`);
        csvRows.push(`Total Books,${overviewData.books.total}`);
        csvRows.push(`Total Chapters,${overviewData.books.chapters}`);
        csvRows.push(`Total Posts,${overviewData.posts.total}`);
        csvRows.push(`Active Posts,${overviewData.posts.active}`);
        csvRows.push(`Total Comments,${overviewData.comments}`);
        csvRows.push(`Total Reviews,${overviewData.reviews}`);
        csvRows.push('');

        // Growth section
        csvRows.push('GROWTH METRICS (Last 30 Days)');
        csvRows.push('Date,Users,Books,Posts');

        if (growthData && growthData.length > 0) {
            growthData.forEach((item: any) => {
                csvRows.push(`${item.date},${item.users},${item.books},${item.posts}`);
            });
        }

        const csvContent = csvRows.join('\n');

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=dashboard-statistics-${new Date().toISOString().split('T')[0]}.csv`,
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);

        return NextResponse.json(
            {
                success: false,
                statusCode: 500,
                message: 'Failed to export statistics',
                error: error.message,
            },
            { status: 500 },
        );
    }
}
