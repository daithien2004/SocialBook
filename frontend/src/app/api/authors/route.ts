// api/authors/route.ts
import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';

export async function GET() {
    try {
        const response = await serverApi.get('/authors');

        // Return proper ResponseDto format
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get authors successfully',
            data: response.data?.data ?? response.data,
            path: '/api/authors',
        });
    } catch (error: any) {
        console.error('GET /api/authors error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Failed to fetch authors',
                error: error.response?.data?.error || 'Server Error',
                timestamp: new Date().toISOString(),
                path: '/api/authors',
            },
            { status: error.response?.status || 500 }
        );
    }
}
