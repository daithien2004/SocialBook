import { NESTJS_TTS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NextRequest, NextResponse } from 'next/server';
// tạo audio cho toàn bộ chapers (1 cuốn sách)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    const { bookId } = await params;

    try {
        const body = await req.json();
        const api = await getAuthenticatedServerApi();
        const response = await api.post(
            NESTJS_TTS_ENDPOINTS.generateBook(bookId),
            body
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to generate book audio',
            },
            { status: error.response?.status || 500 }
        );
    }
}
