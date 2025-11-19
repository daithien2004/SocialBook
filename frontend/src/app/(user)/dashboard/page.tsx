'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  // Dùng useSession làm nguồn chân lý duy nhất cho xác thực
  const { data: session, status } = useSession();

  // Trạng thái loading và chuyển hướng dựa trên `status` của NextAuth
  useEffect(() => {
    // Nếu chưa xác thực và không phải đang loading, chuyển về trang login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Hàm xử lý logout mới
  const handleLogout = async () => {
    // Gọi signOut() của NextAuth để xóa session và cookie
    // Nó sẽ tự động xóa session, bạn không cần dispatch logout thủ công nữa.
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // 4. Hiển thị loading dựa trên `status` của NextAuth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading Session...</p>
        </div>
      </div>
    );
  }

  // 5. Hiển thị nội dung trang chỉ khi đã xác thực
  if (status === 'authenticated' && session?.user) {
    const { user } = session; // Lấy user từ session

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                {user.image && (
                  <div className="relative">
                    <Image
                      src={user.image}
                      alt={user.username || 'User Image'}
                      width={80}
                      height={80}
                      className="rounded-full ring-4 ring-indigo-100"
                    />
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Xin chào, {user.username || user.name}!
                  </h1>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback, nếu status không phải loading và cũng không phải authenticated
  return null;
}
