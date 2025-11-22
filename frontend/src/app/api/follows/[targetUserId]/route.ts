import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

export async function GET(
    request: NextRequest,
    { params }: { params: { targetUserId: string } },
) {
    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.get(
            `follows/${params.targetUserId}`,
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/follows GET error:', error?.response?.data || error);

        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Get follow state request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { targetUserId: string } },
) {
    try {
        const api = await getAuthenticatedServerApi();

        // toggle follow không cần body, chỉ cần user từ token + targetUserId
        const response = await api.post(
            `follows/${params.targetUserId}`,
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/follows POST error:', error?.response?.data || error);

        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Toggle follow request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}
