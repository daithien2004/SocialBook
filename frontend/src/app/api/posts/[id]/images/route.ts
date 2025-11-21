import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json();

    if (!body.imageUrl) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          message: 'imageUrl is required',
        },
        { status: 400 }
      );
    }

    const response = await api.delete(
      NESTJS_POSTS_ENDPOINTS.deleteImage(params.id),
      {
        data: { imageUrl: body.imageUrl },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi xóa ảnh',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
