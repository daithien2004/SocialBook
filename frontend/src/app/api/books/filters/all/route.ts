import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET() {
  try {
    const response = await serverApi.get(NESTJS_BOOKS_ENDPOINTS.getFilters);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.message || 'Failed to fetch filters',
        error: error.response?.data?.error || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    );
  }
}
