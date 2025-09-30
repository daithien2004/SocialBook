'use client';

import { useAppSelector } from '@/store/hooks';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/slice';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Bảng điều khiển</h1>
        <p>Chào mừng đến với bảng điều khiển của bạn!</p>
        <button
          onClick={() => dispatch(logout())}
          className="mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
