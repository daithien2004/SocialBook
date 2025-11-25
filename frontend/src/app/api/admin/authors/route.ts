import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_AUTHORS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

const forbiddenResponse = NextResponse.json(
    {
        success: false,
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden',
    },
    { status: 403 },
);

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const { searchParams } = new URL(request.url);
        const current = parseInt(searchParams.get('current') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const name = searchParams.get('name') || undefined;

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(
            NESTJS_AUTHORS_ENDPOINTS.getAll,
            {
                params: { current, pageSize, name },
            },
        );

        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get authors successfully',
            ...(response.data?.data ? response.data : { data: response.data }),
        });
    } catch (error: any) {
        console.error('GET /api/admin/authors error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy danh sách tác giả thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const body = await request.json();

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.post(
            NESTJS_AUTHORS_ENDPOINTS.create,
            body,
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Create author successfully',
            ...(response.data?.data ? response.data : { data: response.data }),
        });
    } catch (error: any) {
        console.error('POST /api/admin/authors error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || error.message || 'Internal server error',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
