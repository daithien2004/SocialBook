import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import serverApi from '@/src/lib/server-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const response = await serverApi.get(NESTJS_POSTS_ENDPOINTS.getAll, {
      params: { page, limit },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || 'Lỗi khi lấy danh sách bài viết',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();
    const formData = await request.formData();

    const response = await api.post(NESTJS_POSTS_ENDPOINTS.create, formData);

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lỗi khi tạo bài viết',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
