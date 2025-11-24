// api/admin/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

const forbiddenResponse = NextResponse.json(
  {
    success: false,
    statusCode: 403,
    message: 'Forbidden',
    error: 'Forbidden',
  },
  { status: 403 },
);

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return forbiddenResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const authenticatedApi = await getAuthenticatedServerApi();
    const response = await authenticatedApi.get(
      NESTJS_BOOKS_ENDPOINTS.getAllBookForAdmin,
      { params: { page, limit, status, search } },
    );

    // Backend may return { data: { books: [], pagination: {} } } or { data: { data: [], meta: {} } }
    const books = response.data?.books || response.data?.data || [];
    const pagination = response.data?.pagination || response.data?.meta || {};

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: 'Get admin books successfully',
      data: { books, pagination },
    });
  } catch (error: any) {
    console.error('GET /api/admin/books error:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Failed to fetch admin books',
        error: error.response?.data?.error || 'Server Error',
      },
      { status: error.response?.status || 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return forbiddenResponse;
  }

  try {
    const formData = await request.formData();
    const authenticatedApi = await getAuthenticatedServerApi();
    const response = await authenticatedApi.post(
      NESTJS_BOOKS_ENDPOINTS.createBook,
      formData,
    );

    return NextResponse.json({
      success: true,
      statusCode: response.status,
      message: 'Create book successfully',
      data: response.data?.data ? response.data : { data: response.data },
    });
  } catch (error: any) {
    console.error('POST /api/admin/books error:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Internal server error',
        error: error.response?.data?.error || 'Server Error',
      },
      { status: error.response?.status || 500 },
    );
  }
}