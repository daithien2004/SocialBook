import { books } from '@/src/lib/books';
import { chapters } from '@/src/lib/chapters';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookSlug: string; chapterSlug: string }> }
) {
  const { bookSlug, chapterSlug } = await context.params;

  const book = books.find((b) => b.slug === bookSlug);

  const chapter = chapters.find(
    (ch) => ch.slug === chapterSlug && ch.bookId === book?.id
  );

  return NextResponse.json(
    {
      success: true,
      statusCode: 200,
      data: chapter,
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
    },
    { status: 200 }
  );
}
