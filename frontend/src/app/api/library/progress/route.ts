import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function PATCH(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json();

    const response = await api.patch(
      NESTJS_LIBRARY_ENDPOINTS.updateProgress,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lưu tiến độ đọc',
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();

    // Lấy query params từ URL
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const chapterId = searchParams.get('chapterId');

    const response = await api.get(NESTJS_LIBRARY_ENDPOINTS.updateProgress, {
      params: { bookId, chapterId },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy tiến độ đọc',
      },
      { status: error.response?.status || 500 }
    );
  }
}
