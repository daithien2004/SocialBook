'use client';

import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/features/auth/components/LoginWall';
import { ShieldAlert } from 'lucide-react';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppAuth();

  if (!isAuthenticated) {
    return (
      <LoginWall
        icon={<ShieldAlert size={40} className="text-blue-600 dark:text-blue-400" />}
        title="Khu vực quản trị"
        description="Đăng nhập bằng tài khoản quản trị viên để truy cập trang quản lý."
      />
    );
  }

  return <>{children}</>;
}
