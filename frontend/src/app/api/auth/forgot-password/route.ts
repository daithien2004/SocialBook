import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_AUTH_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await serverApi.post(
      NESTJS_AUTH_ENDPOINTS.forgotPassword,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string }; status?: number } };
    return NextResponse.json(
      {
        message:
          err.response?.data?.message || 'Yêu cầu khôi phục mật khẩu thất bại',
      },
      { status: err.response?.status || 500 }
    );
  }
}
