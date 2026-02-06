'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

import {
  useForgotPasswordMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
} from '@/src/features/auth/api/authApi';
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/src/features/auth/types/auth.type';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [resendMessage, setResendMessage] = useState('');

  // Lấy state từ các hooks của RTK Query với tên riêng biệt
  const [
    forgotPassword,
    { isLoading: isSendingOtp, error: forgotPasswordError },
  ] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting, error: resetPasswordError }] =
    useResetPasswordMutation();
  const [resendOtp, { isLoading: isResending, error: resendOtpError }] =
    useResendOtpMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  // Xử lý logic submit form cho cả hai bước
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    // Xóa các thông báo cũ
    setResendMessage('');

    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      }).unwrap();
      setStep('success');
    } catch (err) { }
  };

  const handleSendOtp = async () => {
    setResendMessage('');

    // Ra lệnh cho react-hook-form chỉ validate trường 'email'
    const isEmailValid = await trigger('email');

    // Nếu email không hợp lệ, dừng lại. Lỗi sẽ tự hiển thị.
    if (!isEmailValid) return;

    // Nếu email hợp lệ, lấy giá trị và gọi API
    const email = getValues('email');
    try {
      await forgotPassword({ email }).unwrap();
      setStep('otp');
    } catch (err) { }
  };

  // Xử lý gửi lại OTP
  const handleResendOtp = async () => {
    setResendMessage('');
    const email = getValues('email');
    if (!email) return;

    try {
      await resendOtp({ email }).unwrap();
      setResendMessage('Đã gửi lại mã OTP mới thành công.');
    } catch (err) {}
  };

  // Các hàm điều hướng
  const handleBackClick = () => {
    if (step === 'otp') {
      setStep('email');
    } else {
      router.push('/login');
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  // Helper để lấy thông báo lỗi từ các hook
  const getErrorMessage = (error: any) => {
    if (
      error &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data
    ) {
      return (error.data as { message: string }).message;
    }
    return null;
  };

  const currentError =
    getErrorMessage(forgotPasswordError) ||
    getErrorMessage(resetPasswordError) ||
    getErrorMessage(resendOtpError);

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

          {/* Hiển thị lỗi chung từ RTK Query */}
          {currentError && (
            <div className="rounded-md bg-red-50 p-4 mb-6 text-center">
              <p className="text-sm text-red-800">{currentError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step: Email Input */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quên Mật Khẩu?
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Địa Chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black ${errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
                  >
                    {isSendingOtp ? 'Đang gửi mã OTP...' : 'Gửi Mã OTP'}
                  </button>
                </div>
              </>
            )}

            {/* Step: OTP & New Password */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Đặt Lại Mật Khẩu
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Nhập mã OTP đã được gửi đến{' '}
                    <span className="font-medium">{getValues('email')}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mã OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      {...register('otp')}
                      className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.otp ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="000000"
                      maxLength={6}
                    />
                    {errors.otp && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.otp.message}
                      </p>
                    )}
                    <div className="text-center mt-2">
                      {resendMessage && (
                        <p className="text-green-600 text-sm">
                          {resendMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {isResending ? 'Đang gửi lại...' : 'Gửi Lại Mã'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mật Khẩu Mới
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      {...register('newPassword')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.newPassword
                          ? 'border-red-500'
                          : 'border-gray-300'
                        }`}
                      placeholder="Nhập mật khẩu mới"
                    />
                    {errors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Xác Nhận Mật Khẩu
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.confirmPassword
                          ? 'border-red-500'
                          : 'border-gray-300'
                        }`}
                      placeholder="Xác nhận mật khẩu mới"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
                  >
                    {isResetting
                      ? 'Đang đặt lại mật khẩu...'
                      : 'Đặt Lại Mật Khẩu'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đặt Lại Mật Khẩu Thành Công!
              </h1>
              <p className="text-gray-600 mb-8">
                Bạn có thể đăng nhập bằng mật khẩu mới của mình.
              </p>
              <button
                onClick={handleLoginClick}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all"
              >
                Đến Trang Đăng Nhập
              </button>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <p className="text-center text-gray-600 mt-6">
            Đã nhớ mật khẩu?{' '}
            <button
              onClick={handleLoginClick}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng nhập
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
