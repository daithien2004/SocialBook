import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_RECOMMENDATIONS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

export async function GET(request: NextRequest) {
  try {
    const authenticatedApi = await getAuthenticatedServerApi();

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const response = await authenticatedApi.get(
      NESTJS_RECOMMENDATIONS_ENDPOINTS.getPersonalized,
      {
        params: { page, limit },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.response?.data?.message || 'Failed to fetch recommendations',
        error: error.response?.data?.error || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    );
  }
}
