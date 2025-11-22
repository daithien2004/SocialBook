import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const response = await api.delete(
      NESTJS_LIBRARY_ENDPOINTS.removeBook(params.bookId)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.response?.data?.message || 'Lỗi khi xóa sách khỏi thư viện',
      },
      { status: error.response?.status || 500 }
    );
  }
}
