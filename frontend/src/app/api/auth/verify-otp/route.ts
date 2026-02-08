import { NextResponse } from 'next/server';
import serverApi from '@/lib/server-api';
import { NESTJS_AUTH_ENDPOINTS } from '@/constants/server-endpoints';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await serverApi.post(
      NESTJS_AUTH_ENDPOINTS.verifyOtp,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string }; status?: number } };
    return NextResponse.json(
      { message: err.response?.data?.message || 'Xác thực thất bại' },
      { status: err.response?.status || 500 }
    );
  }
}
