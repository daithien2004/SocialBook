import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const api = await getAuthenticatedServerApi();
    const response = await api.patch(
      NESTJS_REVIEWS_ENDPOINTS.toggleLike(id)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.response?.data?.message || 'Lỗi khi like đánh giá',
      },
      { status: error.response?.status || 500 }
    );
  }
}
