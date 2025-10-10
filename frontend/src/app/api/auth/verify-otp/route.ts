import { NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api'; // Dùng axios instance của server
import { NESTJS_AUTH_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Chuyển tiếp request đến NestJS
    const response = await serverApi.post(
      NESTJS_AUTH_ENDPOINTS.verifyOtp,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || 'Verification failed' },
      { status: error.response?.status || 500 }
    );
  }
}
