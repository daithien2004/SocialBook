'use client';

import { useState } from 'react';
import {
  useForgotPasswordMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
} from '@/src/features/auth/api/authApi';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/src/types/auth';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [resendOtp, { isLoading: isLoadingResend }] = useResendOtpMutation();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });
  const email = watch('email');
  const otp = watch('otp');

  const [forgotPassword, { isLoading: isSendingOtp }] =
    useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await forgotPassword({ email }).unwrap();
      setStep('otp');
    } catch (error: any) {
      setServerError(
        error?.data?.message || 'Failed to send OTP. Please try again.'
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      setStep('success');
    } catch (error: any) {
      setServerError(
        error?.data?.message || 'Invalid OTP or reset failed. Please try again.'
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp({ email }).unwrap();
    } catch (err: any) {
      setServerError(err.data?.message || 'Resend OTP failed');
    }
  };

  const handleBackClick = () => {
    if (step === 'otp') {
      setStep('email');
    } else {
      router.push('/login');
      // window.location.href = '/login';
    }
  };

  const handleLoginClick = () => {
    // window.location.href = '/login';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Step: Email Input */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Forgot Password?
                </h1>
                <p className="text-gray-600 mt-2">
                  Enter your email and we'll send you an OTP to reset your
                  password
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      {...register('email')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendOtp(e);
                        }
                      }}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </>
          )}

          {/* Step: OTP & New Password */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Reset Password
                </h1>
                <p className="text-gray-600 mt-2">
                  Enter the OTP sent to{' '}
                  <span className="font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    {...register('otp')}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.otp ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.otp.message}
                    </p>
                  )}
                  <button
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {isLoadingResend ? 'Resending...' : 'Resent OTP'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    {...register('newPassword')}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                    required
                  />
                  {errors.newPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>
                {serverError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{serverError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleResetPassword(e);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Password Reset Successful!
              </h1>
              <p className="text-gray-600 mb-8">
                Your password has been reset successfully. You can now login
                with your new password.
              </p>
              <button
                onClick={handleLoginClick}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <button
            onClick={handleLoginClick}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
