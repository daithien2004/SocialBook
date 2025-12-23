'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  loginSchema,
  LoginFormValues,
} from '@/src/features/auth/types/auth.type';
import Image from 'next/image';
import { useAppAuth } from '@/src/hooks/useAppAuth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppAuth();

  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setServerError('Sign in failed. Please try again.');
      router.replace('/login');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginFormValues) => {
    setIsCredentialsLoading(true);
    setServerError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        const userRole = sessionData?.user?.role;

        if (userRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setServerError(result?.error || 'Invalid email or password.');
      }
    } catch (error) {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsCredentialsLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setIsGoogleLoading(true);
    signIn('google', { redirect: true, callbackUrl: '/' });
  };

  const isAnyLoading =
    isCredentialsLoading || isGoogleLoading || isAuthLoading;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 py-10 text-white">
          <div className="max-w-2xl mx-auto">
            <div className="ml-40">
              <h1 className="text-5xl md:text-3xl font-bold leading-tight">
                LES MISERABLES
              </h1>
              <p className="text-2xl md:text-3xl text-teal-100 px-10 py-5 font-serif">
                Victor Hugo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black">Đăng Nhập</h2>
            <p className="text-sm text-gray-500 mt-2">
              Chào mừng bạn trở lại với thư viện sách trực tuyến
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200 animate-fade-in">
                <p className="text-sm text-red-800">{serverError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignin}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white 
              hover:bg-gray-50 hover:border-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mr-2" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Đăng nhập bằng Google
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Hoặc
                </span>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="email"
                className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-indigo-600 pointer-events-none"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                className="block w-full px-4 pt-5 pb-3 border border-gray-300 rounded-xl text-gray-900 
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
               transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="lythung10nctop95@gmail.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 animate-fade-in">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-indigo-600 pointer-events-none"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="block w-full px-4 pt-5 pb-3 pr-12 border border-gray-300 rounded-xl text-gray-900 
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
               transition-all duration-200 shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors z-10"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1 animate-fade-in">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isCredentialsLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <div className="text-center text-sm mt-4">
              <span className="text-gray-600">Chưa có tài khoản? </span>
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Tạo tài khoản ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
