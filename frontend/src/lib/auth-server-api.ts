import {getServerSession} from 'next-auth/next';
import serverApi from '@/src/lib/server-api'; // Base axios instance KHÔNG có token
import {authOptions} from '../app/api/auth/[...nextauth]/route';

export async function getAuthenticatedServerApi() {
  // 1. Lấy session. Nhờ Type Augmentation, TypeScript đã hiểu cấu trúc session
  const session = await getServerSession(authOptions);

  // 2. Kiểm tra xác thực
  if (!session || !session.accessToken) {
    // Luôn ném lỗi để API Route có thể bắt và trả về 401
    throw new Error('Unauthorized: Missing valid session or access token.');
  }

  const accessToken = session.accessToken;

  // 3. Tạo một instance mới (hoặc clone) từ serverApi để thêm Authorization Header
  // Việc tạo instance mới là cách an toàn nhất để đảm bảo header không bị dính vào các request khác
  return serverApi.create({
    headers: {
      ...serverApi.defaults.headers,
      Authorization: `Bearer ${accessToken}`, // <-- Đính kèm Token
    },
  });
}
