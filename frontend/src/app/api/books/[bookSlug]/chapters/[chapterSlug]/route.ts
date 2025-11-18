import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import serverApi from '@/src/lib/server-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ bookSlug: string; chapterSlug: string }>;
  }
) {
  try {
    const { bookSlug, chapterSlug } = await params;

    const response = await serverApi.get(
      NESTJS_BOOKS_ENDPOINTS.getChapterBySlug(bookSlug, chapterSlug)
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || 'Failed to resend OTP' },
      { status: error.response?.status || 500 }
    );
  }
}
