// api/admin/books/[bookSlug]/chapters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_CHAPTERS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

const forbiddenResponse = NextResponse.json(
    {
        success: false,
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden',
    },
    { status: 403 },
);

export async function GET(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            bookSlug: string;
        }>;
    }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { bookSlug } = await params;

    try {
        const response = await serverApi.get(
            NESTJS_CHAPTERS_ENDPOINTS.getChapters(bookSlug),
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            },
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Get chapters successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('GET /api/admin/books/[bookSlug]/chapters error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy danh sách chương thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            bookSlug: string;
        }>;
    }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { bookSlug } = await params;

    try {
        const body = await request.json();

        const response = await serverApi.post(
            NESTJS_CHAPTERS_ENDPOINTS.createChapter(bookSlug),
            body,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            },
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'Create chapter successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('POST /api/admin/books/[bookSlug]/chapters error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Tạo chương thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
