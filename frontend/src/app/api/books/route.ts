import { NextRequest, NextResponse } from 'next/server';
import { books } from '@/src/lib/books';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(books, { status: 200 });
  } catch (error) {}
}
