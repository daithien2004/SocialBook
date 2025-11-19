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

export async function POST(request: NextRequest) {
  // Debug: Log incoming request details
  const cookieHeader = request.headers.get('cookie');
  const authHeader = request.headers.get('authorization');

  console.log('[BFF] POST /api/books - incoming cookie:', cookieHeader);
  console.log('[BFF] POST /api/books - incoming authorization header:', authHeader);

  const session = await getServerSession(authOptions);
  console.log('[BFF] POST /api/books - session result:', session);
  console.log('[BFF] POST /api/books - session.user:', session?.user);
  console.log('[BFF] POST /api/books - session.user.role:', session?.user?.role);

  // Check if NEXTAUTH_SECRET is configured
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  console.log('[BFF] POST /api/books - NEXTAUTH_SECRET exists:', !!nextAuthSecret);

  if (!session || session.user.role !== 'admin') {
    console.log('[BFF] POST /api/books - REJECTED: session null or role not admin');
    return NextResponse.json(
      {
        success: false,
        statusCode: 403,
        message: 'Forbidden. Admin access required.',
        error: 'Forbidden',
      },
      { status: 403 },
    );
  }

  console.log('[BFF] POST /api/books - ALLOWED: admin role confirmed');

  const payload = await request.json();

  try {
    const response = await serverApi.post(
      NESTJS_BOOKS_ENDPOINTS.createBook,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Failed to create book',
        error: error.response?.data?.error || 'Server Error',
      },
      { status: error.response?.status || 500 },
    );
  }
}
