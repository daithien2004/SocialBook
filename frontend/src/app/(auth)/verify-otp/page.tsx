'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/src/features/auth/api/authApi';
import { getErrorMessage } from '@/src/lib/utils';

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
      setErrorMsg(getErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    setErrorMsg('');
    try {
      const result = await resendOtp({ email }).unwrap();
      setResendMsg('Đã gửi lại mã OTP mới!');
      setCountdown(result.data?.resendCooldown || 60);
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const handleBackClick = () => {
    router.push('/signup');
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Xác Minh Thành Công!
              </h1>
              <p className="text-gray-600 mb-8">
                Chuyển đến trang đăng nhập trong giây lát...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={handleBackClick}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>

          {/* Hiển thị lỗi */}
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-4 mb-6 text-center">
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
          )}

          {/* Hiển thị thông báo resend */}
          {resendMsg && (
            <div className="rounded-md bg-green-50 p-4 mb-6 text-center">
              <p className="text-sm text-green-700">{resendMsg}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Xác Minh Email</h1>
            <p className="text-gray-600 mt-2">
              Nhập mã OTP đã được gửi đến{' '}
              <span className="font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mã OTP
              </label>
              <div className="flex justify-center gap-2">
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
                    className="w-12 h-12 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-black"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || countdown > 0}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `Gửi lại sau ${countdown}s`
                    : isResending
                      ? 'Đang gửi lại...'
                      : 'Gửi Lại Mã'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.join('').length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Đang xác minh...' : 'Xác Nhận'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Đã có tài khoản?{' '}
          <button
            onClick={handleLoginClick}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}
