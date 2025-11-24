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
            NESTJS_AUTHORS_ENDPOINTS.getById(id),
        );

        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get author successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('GET /api/admin/authors/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy thông tin tác giả thất bại',
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
            NESTJS_AUTHORS_ENDPOINTS.update(id),
            body,
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Update author successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('PUT /api/admin/authors/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Cập nhật tác giả thất bại',
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
            NESTJS_AUTHORS_ENDPOINTS.delete(id),
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Delete author successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('DELETE /api/admin/authors/[id] error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Xóa tác giả thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
