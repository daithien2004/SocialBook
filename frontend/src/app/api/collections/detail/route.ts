import { NextRequest, NextResponse } from 'next/server';
import serverApi from "@/src/lib/server-api";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get('userId');
        const id = searchParams.get('id');
        const response = await serverApi.get(
            "/collections/detail",{
                params: {
                    userId,
                    id,
                },
            }
        );
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('BFF /api/collections/detail error:', error?.response?.data || error);

        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { message: error.message },
                { status: 401 },
            );
        }
        return NextResponse.json(
            {
                message:
                    error?.response?.data?.message ||
                    'Get comments request failed',
            },
            { status: error?.response?.status || 500 },
        );
    }
}
