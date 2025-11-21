// api/genres/route.ts
import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';

export async function GET() {
    try {
        const response = await serverApi.get('/genres');

        // Return proper ResponseDto format
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get genres successfully',
            data: response.data?.data ?? response.data,
            path: '/api/genres',
        });
    } catch (error: any) {
        console.error('GET /api/genres error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Failed to fetch genres',
                error: error.response?.data?.error || 'Server Error',
                timestamp: new Date().toISOString(),
                path: '/api/genres',
            },
            { status: error.response?.status || 500 }
        );
    }
}
