'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/lib/utils';

import { AppButton } from '@/components/common/AppButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyOtpPage() {
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
    } catch (err) {
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
    } catch (err) {
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
      <div className="min-h-screen flex">
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-zinc-900">
          <Image
            src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
            alt="Verify OTP background"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 py-10 px-10 text-white">
            <div className="max-w-2xl mx-auto ml-10">
              <h1 className="text-5xl font-bold leading-tight font-serif mb-4">LES MISERABLES</h1>
              <p className="text-2xl text-white/90 font-serif italic border-l-4 border-white/60 pl-4">
                &quot;Even the darkest night will end and the sun will rise.&quot;
              </p>
              <p className="mt-4 text-lg font-medium">— Victor Hugo</p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-zinc-950">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardContent className="pt-10 pb-10">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Xác Minh Thành Công!</h2>
                <p className="text-muted-foreground">Đang chuyển đến trang đăng nhập...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <Image
          src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
          alt="Verify OTP background"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 py-10 px-10 text-white">
          <div className="max-w-2xl mx-auto ml-10">
            <h1 className="text-5xl font-bold leading-tight font-serif mb-4">
              LES MISERABLES
            </h1>
            <p className="text-2xl text-white/90 font-serif italic border-l-4 border-white/60 pl-4">
              &quot;Even the darkest night will end and the sun will rise.&quot;
            </p>
            <p className="mt-4 text-lg font-medium">— Victor Hugo</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-zinc-950">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-start mb-2">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
                onClick={handleBackClick}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Xác Minh Email</CardTitle>
              <CardDescription className="text-base mt-2">
                Nhập mã OTP đã được gửi đến{' '}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMsg && (
              <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {errorMsg}
              </div>
            )}

            {resendMsg && (
              <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {resendMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-center">Mã OTP</label>
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
                      className="w-12 h-14 text-2xl font-bold text-center border-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all bg-background"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 font-medium"
                  >
                    {countdown > 0
                      ? `Gửi lại sau ${countdown}s`
                      : isResending
                        ? 'Đang gửi lại...'
                        : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>

              <AppButton
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isVerifying || otp.join('').length !== 6}
                loading={isVerifying}
                loadingText="Đang xác minh..."
              >
                Xác Nhận
              </AppButton>
            </form>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">Đã có tài khoản? </span>
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>}>
      <VerifyOtpPage />
    </Suspense>
  );
}
