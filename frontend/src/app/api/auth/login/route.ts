import { NextResponse, NextRequest } from 'next/server';
import serverApi from '@/lib/server-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await serverApi.post('/auth/login', body);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string }; status?: number } };
    return NextResponse.json(
      { message: err.response?.data?.message || 'Đăng nhập thất bại' },
      { status: err.response?.status || 500 },
    );
  }
}
