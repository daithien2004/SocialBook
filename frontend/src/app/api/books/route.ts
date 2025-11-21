// api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const response = await serverApi.get(NESTJS_BOOKS_ENDPOINTS.getBooks);
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
