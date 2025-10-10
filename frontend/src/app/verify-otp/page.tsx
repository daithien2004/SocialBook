// app/verify-otp/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/src/features/auth/api/authApi';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [verifyOtp, { isLoading: isVerifying, error: verifyError }] =
    useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending, error: resendError }] =
    useResendOtpMutation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return;
    }

    try {
      await verifyOtp({ email, otp: otpCode }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Verification failed:', err);
    }
  };

  const handleResendOtp = async () => {
    setResendMessage('');
    try {
      await resendOtp({ email }).unwrap();
      setResendMessage('A new OTP has been sent successfully.');
    } catch (err: any) {
      console.error('Resend OTP failed:', err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Successful!
          </h3>
          <p className="text-gray-600">
            Your account has been verified. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code to{' '}
            <span className="font-medium">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {verifyError && 'data' in verifyError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {(verifyError.data as { message: string }).message ||
                  'Invalid OTP'}
              </p>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center text-sm mt-4 space-y-2">
            {resendMessage && <p className="text-green-600">{resendMessage}</p>}

            {resendError && 'data' in resendError && (
              <p className="text-red-600">
                {(resendError.data as { message: string }).message ||
                  'Failed to resend'}
              </p>
            )}

            <span className="text-gray-600">Didn't receive the code? </span>
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={handleResendOtp}
            >
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
