'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/src/features/auth/api/authApi';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    try {
      await verifyOtp({ email, otp: otpCode }).unwrap();
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    setErrorMsg('');
    try {
      await resendOtp({ email }).unwrap();
      setResendMsg('Đã gửi lại mã OTP mới!');
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg('Gửi lại thất bại. Vui lòng thử lại sau.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center transform transition-all duration-500 scale-105">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500 mb-6 shadow-xl">
            <svg
              className="h-12 w-12 text-white"
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
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Xác Minh Thành Công!
          </h3>
          <p className="text-gray-600">
            Chuyển đến trang đăng nhập trong giây lát...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-full flex items-center justify-center px-6 py-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 space-y-8 transform transition-all hover:shadow-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Xác Minh Email</h2>
            <p className="text-gray-600 mt-3">
              Chúng tôi đã gửi mã{' '}
              <strong className="text-blue-600">6 chữ số</strong> đến
            </p>
            <p className="text-lg font-semibold text-blue-600 mt-2">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-pulse">
                {errorMsg}
              </div>
            )}

            {resendMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                {resendMsg}
              </div>
            )}

            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.join('').length !== 6}
              className="w-full py-4 rounded-xl text-white font-semibold text-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isVerifying ? 'Đang xác minh...' : 'Xác Nhận'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              Chưa nhận được mã?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
