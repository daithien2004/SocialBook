import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json(); // { bookId, status }

    const response = await api.post(
      NESTJS_LIBRARY_ENDPOINTS.updateStatus,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.response?.data?.message || 'Lỗi khi cập nhật trạng thái sách',
      },
      { status: error.response?.status || 500 }
    );
  }
}
