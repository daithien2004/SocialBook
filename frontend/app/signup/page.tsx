'use client';

import AuthForm from '@/components/auth-form';
import { useRefreshToken } from '@/features/auth/hooks/useRefreshToken';

export default function SignupPage() {
  useRefreshToken(); // Kích hoạt làm mới token
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Đăng ký</h1>
        <AuthForm type="signup" />
      </div>
    </div>
  );
}
