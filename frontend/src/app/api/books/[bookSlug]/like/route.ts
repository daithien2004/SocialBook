import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      bookSlug: string;
    }>;
  }
) {
  try {
    const { bookSlug } = await params;

    // 1. Lấy instance axios đã có token của user
    const api = await getAuthenticatedServerApi();

    // 2. Gọi sang NestJS: PATCH /books/:id/like
    const response = await api.patch(NESTJS_BOOKS_ENDPOINTS.like(bookSlug));

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi thích sách',
      },
      { status: error.response?.status || 500 }
    );
  }
}
