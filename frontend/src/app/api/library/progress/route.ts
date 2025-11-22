import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function PATCH(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json(); // { bookId, chapterId, progress }

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
