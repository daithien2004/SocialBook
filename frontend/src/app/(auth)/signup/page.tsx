'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupMutation } from '@/src/features/auth/api/authApi';
import Link from 'next/link';
import Image from 'next/image';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  SignupFormValues,
  signupSchema,
} from '@/src/features/auth/types/auth.type';

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading, error }] = useSignupMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup(data).unwrap();
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      console.error('Signup failed:', err);
    }
  };

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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all duration-300 hover:shadow-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black">Tạo Tài Khoản</h2>
            <p className="text-sm text-gray-500 mt-2">
              Tham gia cộng đồng yêu sách của chúng tôi
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {error && 'data' in error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200 animate-fade-in">
                <p className="text-sm text-red-800">
                  {(error.data as { message: string }).message ||
                    'Đã xảy ra lỗi không xác định'}
                </p>
              </div>
            )}

            <div className="relative">
              <label
                htmlFor="username"
                className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-indigo-600 pointer-events-none"
              >
                Tên đăng nhập
              </label>
              <input
                id="username"
                {...register('username')}
                className={`block w-full px-4 pt-5 pb-3 border rounded-xl text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                transition-all duration-200 shadow-sm placeholder-gray-400 ${
                  formErrors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="thungly123"
                aria-invalid={!!formErrors.username}
                aria-describedby={
                  formErrors.username ? 'username-error' : undefined
                }
              />
              {formErrors.username && (
                <p
                  id="username-error"
                  className="text-sm text-red-500 mt-1 animate-fade-in"
                >
                  {formErrors.username.message}
                </p>
              )}
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
                {...register('email')}
                type="email"
                className={`block w-full px-4 pt-5 pb-3 border rounded-xl text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                transition-all duration-200 shadow-sm placeholder-gray-400 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="thungly@gmail.com"
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p
                  id="email-error"
                  className="text-sm text-red-500 mt-1 animate-fade-in"
                >
                  {formErrors.email.message}
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
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`block w-full px-4 pt-5 pb-3 pr-12 border rounded-xl text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                transition-all duration-200 shadow-sm ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                aria-invalid={!!formErrors.password}
                aria-describedby={
                  formErrors.password ? 'password-error' : undefined
                }
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
              {formErrors.password && (
                <p
                  id="password-error"
                  className="text-sm text-red-500 mt-1 animate-fade-in"
                >
                  {formErrors.password.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-indigo-600 pointer-events-none"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`block w-full px-4 pt-5 pb-3 pr-12 border rounded-xl text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                transition-all duration-200 shadow-sm ${
                  formErrors.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="••••••••"
                aria-invalid={!!formErrors.confirmPassword}
                aria-describedby={
                  formErrors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors z-10"
              >
                {showConfirmPassword ? (
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
              {formErrors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-sm text-red-500 mt-1 animate-fade-in"
                >
                  {formErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-blue-500 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Tạo Tài Khoản'
              )}
            </button>

            <div className="text-center text-sm mt-4">
              <span className="text-gray-600">Đã có tài khoản? </span>
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
