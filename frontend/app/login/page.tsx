'use client';

import AuthForm from '@/components/auth-form';
import { useRefreshToken } from '@/hooks/use-refresh-token';

export default function LoginPage() {
  useRefreshToken(); // Kích hoạt làm mới token
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>
        <AuthForm type="login" />
      </div>
    </div>
  );
}
