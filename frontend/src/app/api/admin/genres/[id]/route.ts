import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_GENRES_ENDPOINTS } from '@/src/constants/server-endpoints';
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

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const { id } = await params;

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(
            NESTJS_GENRES_ENDPOINTS.getById(id),
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /api/admin/genres/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy thông tin thể loại thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const { id } = await params;
        const body = await request.json();

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.put(
            NESTJS_GENRES_ENDPOINTS.update(id),
            body,
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('PUT /api/admin/genres/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Cập nhật thể loại thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const { id } = await params;

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.delete(
            NESTJS_GENRES_ENDPOINTS.delete(id),
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('DELETE /api/admin/genres/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Xóa thể loại thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
