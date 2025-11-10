import { NextRequest, NextResponse } from 'next/server';
import { books } from '@/src/lib/books';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  const book = books.find((b) => b.slug === slug);

  return NextResponse.json(book, { status: 200 });
}
