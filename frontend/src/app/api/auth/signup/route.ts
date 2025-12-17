import { NextResponse, NextRequest } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_AUTH_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await serverApi.post(NESTJS_AUTH_ENDPOINTS.signup, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || 'Signup failed' },
      { status: error.response?.status || 500 }
    );
  }
}
