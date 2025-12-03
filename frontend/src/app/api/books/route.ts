import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '12';
    const search = searchParams.get('search') || '';
    const genres = searchParams.get('genres') || '';

    const response = await serverApi.get(NESTJS_BOOKS_ENDPOINTS.getBooks, {
      params: { page, limit, search, genres },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.message || 'Failed to fetch books',
      },
      { status: error.response?.status || 500 }
    );
  }
}
