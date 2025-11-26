import { getAuthenticatedServerApi } from "@/src/lib/auth-server-api";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const api = await getAuthenticatedServerApi();
        const { searchParams } = new URL(request.url);
        const days = searchParams.get('days');

        const response = await api.post(
            '/statistics/seed-reading-history',
            {},
            { params: { days } }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || 'Failed to seed reading history' },
            { status: error.response?.status || 500 }
        );
    }
}
