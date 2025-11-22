import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'READING';
    const api = await getAuthenticatedServerApi();

    const response = await api.get(NESTJS_LIBRARY_ENDPOINTS.getLibrary, {
      params: { status },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.response?.data?.message || 'Lỗi khi lấy danh sách thư viện',
      },
      { status: error.response?.status || 500 }
    );
  }
}
