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
        const formData = await request.formData();
        const authenticatedApi = await getAuthenticatedServerApi();

        // We need to send FormData to the backend.
        // axios automatically sets the Content-Type to multipart/form-data with boundary when passing FormData
        const response = await authenticatedApi.post(
            NESTJS_CHAPTERS_ENDPOINTS.importPreview(bookSlug),
            formData,
        );

        return NextResponse.json({
            success: true,
            statusCode: response.status,
            message: 'File parsed successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('POST /api/admin/books/[bookSlug]/chapters/import error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Import failed',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
