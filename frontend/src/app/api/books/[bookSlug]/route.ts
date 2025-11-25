import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      bookSlug: string;
    }>;
  }
) {
  const { bookSlug } = await params;

  try {
    // 1. Lấy session (nếu có)
    const session = await getServerSession(authOptions);
    let api = serverApi;

    // 2. Nếu có session, tạo instance mới có kèm Token
    if (session && session.accessToken) {
      api = serverApi.create({
        headers: {
          ...serverApi.defaults.headers,
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    }

    // 3. Gọi Backend (có hoặc không có Token)
    const response = await api.get(
      NESTJS_BOOKS_ENDPOINTS.getBookBySlug(bookSlug)
    );
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
