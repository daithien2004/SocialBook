// api/admin/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

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

    const response = await serverApi.get(
      NESTJS_BOOKS_ENDPOINTS.getAllBookForAdmin,
      {
        params: { page, limit, status, search },
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: 'Get admin books successfully',
      data: response.data?.data ?? response.data,
    });
  } catch (error: any) {
    console.error('GET /api/admin/books error:', error.response?.data || error.message);

    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Lấy danh sách sách thất bại',
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
    // Get FormData from request (not JSON)
    const formData = await request.formData();

    // Forward the FormData to NestJS backend
    const response = await serverApi.post(
      NESTJS_BOOKS_ENDPOINTS.createBook,
      formData,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          // Don't set Content-Type, let axios handle it for FormData
        },
      },
    );

    return NextResponse.json({
      success: true,
      statusCode: response.status,
      message: 'Create book successfully',
      data: response.data?.data ?? response.data,
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