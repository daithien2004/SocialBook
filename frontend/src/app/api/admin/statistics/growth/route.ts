import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_STATISTICS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
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

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days');

    try {
        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(
            NESTJS_STATISTICS_ENDPOINTS.growth(days ? parseInt(days) : undefined),
        );

        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Growth metrics retrieved successfully',
            data: response.data.data,
        });
    } catch (error: any) {
        console.error(
            'GET /api/admin/statistics/growth error:',
            error.response?.data || error.message,
        );

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message:
                    error.response?.data?.message || 'Failed to retrieve growth metrics',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
