import { NextResponse, NextRequest } from 'next/server';
import serverApi from '@/src/lib/server-api'; // Import axios instance của server
import { NESTJS_AUTH_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(request: NextRequest) {
  try {
    // 1. Lấy dữ liệu (email, password, username) từ client
    const body = await request.json();

    // 2. Dùng `serverApi` để chuyển tiếp request đến NestJS
    const response = await serverApi.post(NESTJS_AUTH_ENDPOINTS.signup, body);

    // 3. Trả về kết quả từ NestJS cho client
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Xử lý lỗi nếu không gọi được NestJS
    return NextResponse.json(
      { message: error.response?.data?.message || 'Signup failed' },
      { status: error.response?.status || 500 }
    );
  }
}
