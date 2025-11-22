import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();

    const body = await request.json();

    const response = await api.post(NESTJS_REVIEWS_ENDPOINTS.create, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi tạo đánh giá',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
