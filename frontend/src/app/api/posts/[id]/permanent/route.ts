import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const response = await api.delete(
      NESTJS_POSTS_ENDPOINTS.deletePermanent(params.id)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || 'Lỗi khi xóa vĩnh viễn bài viết',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
