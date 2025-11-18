'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  loginSchema,
  LoginFormValues,
} from '@/src/features/auth/types/auth.type';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // State để quản lý trạng thái loading và lỗi từ server
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Chuyển hướng người dùng nếu họ đã đăng nhập
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Lấy lỗi từ URL (ví dụ: khi đăng nhập Google thất bại)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setServerError('Sign in failed. Please try again.');
      // Xóa query param 'error' khỏi URL để không hiển thị lại khi F5
      router.replace('/login');
    }
  }, [searchParams, router]);

  // Cấu hình react-hook-form với Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  // Xử lý đăng nhập bằng email/password
  const onSubmit = async (data: LoginFormValues) => {
    setIsCredentialsLoading(true);
    setServerError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Không tự động chuyển hướng
        email: data.email,
        password: data.password,
      });

      if (result?.ok) {
        router.push('/'); // Chuyển hướng khi thành công
      } else {
        setServerError(result?.error || 'Invalid email or password.');
      }
    } catch (error) {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsCredentialsLoading(false);
    }
  };

  // Xử lý đăng nhập bằng Google
  const handleGoogleSignin = () => {
    setIsGoogleLoading(true);
    // Để NextAuth tự xử lý redirect cho Google
    signIn('google', { callbackUrl: '/' });
  };

  // Cờ chung để vô hiệu hóa các nút
  const isAnyLoading =
    isCredentialsLoading || isGoogleLoading || status === 'loading';

  // Màn hình loading ban đầu khi kiểm tra session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{serverError}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isAnyLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCredentialsLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignin}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mr-2" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="-10 0 60 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M44.5 24.3H24.5V34.3H36.5C35.5 37.3 32.5 39.3 29.5 39.3C24.5 39.3 20.5 35.3 20.5 30.3C20.5 25.3 24.5 21.3 29.5 21.3C31.8 21.3 33.8 22.1 35.3 23.5L42.3 16.5C38.8 13.5 34.5 11.3 29.5 11.3C20.5 11.3 13.5 18.3 13.5 27.3C13.5 36.3 20.5 43.3 29.5 43.3C38.5 43.3 44.5 37.3 44.5 28.3C44.5 26.8 44.5 25.5 44.5 24.3Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M4.5 24.3H24.5V34.3H12.5C11.5 37.3 8.5 39.3 5.5 39.3C0.5 39.3 -3.5 35.3 -3.5 30.3C-3.5 25.3 0.5 21.3 5.5 21.3C7.8 21.3 9.8 22.1 11.3 23.5L18.3 16.5C14.8 13.5 10.5 11.3 5.5 11.3C-3.5 11.3 -10.5 18.3 -10.5 27.3C-10.5 36.3 -3.5 43.3 5.5 43.3C14.5 43.3 20.5 37.3 20.5 28.3C20.5 26.8 20.5 25.5 20.5 24.3Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M29.5 11.3C20.5 11.3 13.5 18.3 13.5 27.3C13.5 36.3 20.5 43.3 29.5 43.3C38.5 43.3 44.5 37.3 44.5 28.3C44.5 26.8 44.5 25.5 44.5 24.3H24.5V34.3H36.5C35.5 37.3 32.5 39.3 29.5 39.3C24.5 39.3 20.5 35.3 20.5 30.3C20.5 25.3 24.5 21.3 29.5 21.3C31.8 21.3 33.8 22.1 35.3 23.5L42.3 16.5C38.8 13.5 34.5 11.3 29.5 11.3Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M29.5 11.3C20.5 11.3 13.5 18.3 13.5 27.3C13.5 36.3 20.5 43.3 29.5 43.3C38.5 43.3 44.5 37.3 44.5 28.3C44.5 26.8 44.5 25.5 44.5 24.3H24.5V34.3H36.5C35.5 37.3 32.5 39.3 29.5 39.3C24.5 39.3 20.5 35.3 20.5 30.3C20.5 25.3 24.5 21.3 29.5 21.3C31.8 21.3 33.8 22.1 35.3 23.5L42.3 16.5C38.8 13.5 34.5 11.3 29.5 11.3Z"
                      fill="#34A853"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
