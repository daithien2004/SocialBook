import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';
import serverApi from '@/src/lib/server-api';

// GET: Lấy danh sách Folder
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const url = `${NESTJS_LIBRARY_ENDPOINTS.collections}?userId=${userId}`;

    const response = await serverApi.get(url);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách folder' },
      { status: 500 }
    );
  }
}

// POST: Tạo Folder mới
export async function POST(request: NextRequest) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json(); // { name, description, isPublic }

    const response = await api.post(NESTJS_LIBRARY_ENDPOINTS.collections, body);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo folder',
      },
      { status: error.response?.status || 500 }
    );
  }
}
