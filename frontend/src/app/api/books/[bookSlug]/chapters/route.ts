import { NESTJS_CHAPTERS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { books } from '@/src/lib/books';
import serverApi from '@/src/lib/server-api';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      bookSlug: string;
    }>;
  }
) {
  const { bookSlug } = await params;

  try {
    const response = await serverApi.get(
      NESTJS_CHAPTERS_ENDPOINTS.getChapters(bookSlug)
    );
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
