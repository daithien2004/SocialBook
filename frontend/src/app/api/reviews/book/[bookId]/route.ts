import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';
import serverApi from '@/src/lib/server-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;

    // 1. Lấy session (nếu có)
    const session = await getServerSession(authOptions);
    let api = serverApi;

    // 2. Nếu có session, tạo instance mới có kèm Token
    if (session && session.accessToken) {
      api = serverApi.create({
        headers: {
          ...serverApi.defaults.headers,
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    }

    const response = await api.get(NESTJS_REVIEWS_ENDPOINTS.getByBook(bookId));

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá',
        error: error?.message || error,
      },
      { status: error.response?.status || 500 }
    );
  }
}
