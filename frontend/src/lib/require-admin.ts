import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.config';

/**
 * Kiểm tra quyền admin ở tầng server (component/action).
 * Không đăng nhập → redirect /login; không phải admin → redirect /403.
 * Đây là lớp chốt: role được đọc từ session server-side mỗi lần vào trang,
 * không giống middleware — nhưng vẫn cần backend RolesGuard làm quyết định cuối.
 */
export async function requireAdmin(): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }
    if (session.user.role !== 'admin') {
        redirect('/403');
    }
}
