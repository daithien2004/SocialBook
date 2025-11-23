// api/admin/books/[bookSlug]/chapters/[chapterId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_CHAPTERS_ENDPOINTS } from '@/src/constants/server-endpoints';
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

// GET a specific chapter (admin)
export async function GET(request: NextRequest, { params }: { params: Promise<{ bookSlug: string; chapterId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { bookSlug, chapterId } = await params;
    try {
        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(
            NESTJS_CHAPTERS_ENDPOINTS.getChapterById(bookSlug, chapterId),
        );
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get chapter successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('GET /api/admin/books/[bookSlug]/chapters/[chapterId] error:', error.response?.data || error.message);
        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy chương thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

// UPDATE a chapter (admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ bookSlug: string; chapterId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { bookSlug, chapterId } = await params;
    try {
        const body = await request.json();
        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.put(
            NESTJS_CHAPTERS_ENDPOINTS.updateChapterAdmin(bookSlug, chapterId),
            body,
        );
        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Update chapter successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('PUT /api/admin/books/[bookSlug]/chapters/[chapterId] error:', error.response?.data || error.message);
        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Cập nhật chương thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

// DELETE a chapter (admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bookSlug: string; chapterId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { bookSlug, chapterId } = await params;
    try {
        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.delete(
            NESTJS_CHAPTERS_ENDPOINTS.deleteChapterAdmin(bookSlug, chapterId),
        );
        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Delete chapter successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('DELETE /api/admin/books/[bookSlug]/chapters/[chapterId] error:', error.response?.data || error.message);
        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Xóa chương thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
