import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/src/constants/server-endpoints';

// GET: Lấy chi tiết folder + sách bên trong
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(id);
    const api = await getAuthenticatedServerApi();
    const response = await api.get(
      NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id)
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy chi tiết folder' },
      { status: 500 }
    );
  }
}

// PATCH: Đổi tên folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const body = await request.json();
    const response = await api.patch(
      NESTJS_LIBRARY_ENDPOINTS.collectionDetail(params.id),
      body
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật folder' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const api = await getAuthenticatedServerApi();
    const response = await api.delete(
      NESTJS_LIBRARY_ENDPOINTS.collectionDetail(params.id)
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xóa folder' },
      { status: 500 }
    );
  }
}
