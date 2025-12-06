import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '12';

    const search = searchParams.get('search') || undefined;
    const genres = searchParams.get('genres') || undefined;
    const tags = searchParams.get('tags') || undefined;

    const sortBy = searchParams.get('sortBy') || undefined;

    const order = searchParams.get('order') || undefined;

    const response = await serverApi.get(NESTJS_BOOKS_ENDPOINTS.getBooks, {
      params: {
        page,
        limit,
        search,
        genres,
        tags,
        sortBy,
        order,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.message || 'Failed to fetch books',
        error: error.response?.data?.error || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    );
  }
}
