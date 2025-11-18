import { books } from '@/src/lib/books';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookSlug: string }> }
) {
  const { bookSlug } = await context.params;

  const book = books.find((b) => b.slug === bookSlug);

  // const bookChapters = chapters.filter((ch) => ch.bookId === book?.id);

  return NextResponse.json(
    {
      success: true,
      statusCode: 200,
      // data: bookChapters,
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
    },
    { status: 200 }
  );
}
