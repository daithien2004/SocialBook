import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

export async function GET(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            bookId: string;
        }>;
    }
) {
    const { bookId } = await params;

    try {
        const response = await serverApi.get(
            NESTJS_BOOKS_ENDPOINTS.getBookStats(bookId)
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to fetch books',
            },
            { status: error.response?.status || 500 }
        );
    }
}
