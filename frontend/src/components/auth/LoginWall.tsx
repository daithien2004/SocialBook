'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface LoginWallProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}


export default function LoginWall({
  icon,
  title,
  description,
  secondaryLabel,
  secondaryHref,
}: LoginWallProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-white/5">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon ?? <BookOpen size={40} className="text-blue-600 dark:text-blue-400" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col gap-3">
          <button
            id="login-wall-login-btn"
            onClick={() => router.push('/login')}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
          >
            Đăng nhập ngay
          </button>

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="w-full py-3 px-6 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all text-center"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
