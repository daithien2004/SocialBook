import { NextResponse, NextRequest } from 'next/server';
import serverApi from '@/lib/server-api';
import { NESTJS_AUTH_ENDPOINTS } from '@/constants/server-endpoints';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await serverApi.post(NESTJS_AUTH_ENDPOINTS.signup, body);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string }; status?: number } };
    return NextResponse.json(
      { message: err.response?.data?.message || 'Đăng ký thất bại' },
      { status: err.response?.status || 500 }
    );
  }
}
