import { NESTJS_TTS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NextRequest, NextResponse } from 'next/server';

// nghe audio của 1 chapter
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params;

    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.post(
            NESTJS_TTS_ENDPOINTS.incrementPlay(chapterId)
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to increment play count',
            },
            { status: error.response?.status || 500 }
        );
    }
}
