import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

export async function GET(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.get('/statistics/analytics/geographic');

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /api/admin/statistics/analytics/geographic error:', error.response?.data || error);
        return NextResponse.json(
            error.response?.data || {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.message || 'Internal server error',
            },
            { status: error.response?.status || 500 }
        );
    }
}
