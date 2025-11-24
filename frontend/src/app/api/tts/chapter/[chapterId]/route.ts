import { NESTJS_TTS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NextRequest, NextResponse } from 'next/server';

// lấy audio của 1 chapter
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params;

    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.get(
            NESTJS_TTS_ENDPOINTS.getByChapter(chapterId)
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to fetch TTS',
                data: null,
            },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params;

    try {
        const body = await req.json();
        const api = await getAuthenticatedServerApi();
        const response = await api.post(
            NESTJS_TTS_ENDPOINTS.generateChapter(chapterId),
            body
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to generate audio',
            },
            { status: error.response?.status || 500 }
        );
    }
}

// xóa audio của 1 chapter
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params;

    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.delete(
            NESTJS_TTS_ENDPOINTS.delete(chapterId)
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.response?.data?.message || 'Failed to delete TTS',
            },
            { status: error.response?.status || 500 }
        );
    }
}
