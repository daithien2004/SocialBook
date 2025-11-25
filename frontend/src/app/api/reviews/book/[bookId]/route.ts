import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';
import serverApi from '@/src/lib/server-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
      const { bookId } = await params;
    const response = await serverApi.get(
      NESTJS_REVIEWS_ENDPOINTS.getByBook(bookId)
    );

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
