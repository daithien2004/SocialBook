'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupMutation } from '@/src/features/auth/api/authApi';
import Link from 'next/link';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SignupFormValues, signupSchema } from '@/src/features/auth/types/auth';

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading, error }] = useSignupMutation();

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');

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
      const result = await signup(data).unwrap();

      setOtpCode(result.otp);
      setEmailForOtp(data.email);
      setShowOtpModal(true);
      reset();
    } catch (err: any) {}
  };

  if (showOtpModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Registration Successful!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              We've sent an OTP to <strong>{emailForOtp}</strong>
            </p>
            {process.env.NODE_ENV === 'development' && otpCode && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800 mb-1">
                  Dev Mode - Your OTP:
                </p>
                <p className="text-lg font-mono font-bold text-yellow-900">
                  {otpCode}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Please check your email to verify your account.
            </p>
            <button
              onClick={() =>
                router.push(
                  `/verify-otp?email=${encodeURIComponent(emailForOtp)}`
                )
              }
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Verify OTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* 4. Hiển thị lỗi trực tiếp từ `error` của RTK Query */}
          {error && 'data' in error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {/* Truy cập an toàn vào message lỗi */}
                {(error.data as { message: string }).message ||
                  'An unknown error occurred'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                {...register('username')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  formErrors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter username"
                aria-invalid={!!formErrors.username}
                aria-describedby={
                  formErrors.username ? 'username-error' : undefined
                }
              />
              {formErrors.username && (
                <p id="username-error" className="text-xs text-red-600 mt-1">
                  {formErrors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email"
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-xs text-red-600 mt-1">
                  {formErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                {...register('password')}
                type="password"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password"
                aria-invalid={!!formErrors.password}
                aria-describedby={
                  formErrors.password ? 'password-error' : undefined
                }
              />
              {formErrors.password && (
                <p id="password-error" className="text-xs text-red-600 mt-1">
                  {formErrors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                {...register('confirmPassword')}
                type="password"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  formErrors.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Confirm password"
                aria-invalid={!!formErrors.confirmPassword}
                aria-describedby={
                  formErrors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
              {formErrors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-xs text-red-600 mt-1"
                >
                  {formErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
