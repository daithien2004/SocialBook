import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';
import serverApi from '@/src/lib/server-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await serverApi.get(
      NESTJS_POSTS_ENDPOINTS.getOne(params.id)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi lấy bài viết',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const formData = await request.formData();

    const response = await api.patch(
      NESTJS_POSTS_ENDPOINTS.update(params.id),
      formData
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi cập nhật bài viết',
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
    const response = await api.delete(NESTJS_POSTS_ENDPOINTS.delete(params.id));

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi xóa bài viết',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
