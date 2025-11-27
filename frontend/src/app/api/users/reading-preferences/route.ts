import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_USERS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const response = await api.get(NESTJS_USERS_ENDPOINTS.readingPreferences);

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching reading preferences:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch reading preferences',
            },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const api = await getAuthenticatedServerApi();
        const body = await request.json();

        const response = await api.put(
            NESTJS_USERS_ENDPOINTS.readingPreferences,
            body
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error updating reading preferences:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.response?.data?.message || 'Failed to update reading preferences',
            },
            { status: error.response?.status || 500 }
        );
    }
}
