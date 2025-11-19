import { NextRequest, NextResponse } from 'next/server';
import { posts } from '@/src/lib/posts';
import serverApi from '@/src/lib/server-api';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      statusCode: 200,
      data: posts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: 'Lỗi server khi lấy bài viết',
        error: error?.message || error,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await serverApi.post(
      NESTJS_POSTS_ENDPOINTS.create,
      formData
    );

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
