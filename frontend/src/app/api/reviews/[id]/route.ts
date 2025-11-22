import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json();

    // Gọi NestJS: PATCH /reviews/:id
    const response = await api.patch(
      NESTJS_REVIEWS_ENDPOINTS.update(params.id),
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi cập nhật đánh giá',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();

    const response = await api.delete(
      NESTJS_REVIEWS_ENDPOINTS.delete(params.id)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi xóa đánh giá',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
