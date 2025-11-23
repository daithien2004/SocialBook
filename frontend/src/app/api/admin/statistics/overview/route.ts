import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
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

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(NESTJS_STATISTICS_ENDPOINTS.overview);
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Overview statistics retrieved successfully',
            data: response.data.data,
        });
    } catch (error: any) {
        console.error(
            'GET /api/admin/statistics/overview error:',
            error.response?.data || error.message,
        );

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message:
                    error.response?.data?.message ||
                    'Failed to retrieve overview statistics',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
