'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  useResendOtp,
  useVerifyOtp,
} from '@/features/auth/api/auth.mutations';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { FullScreenSpinner } from '@/components/shared/AppLoading';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { AppButton } from '@/components/shared/AppButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyOtpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) return;

    try {
      await verifyOtp.mutateAsync({ email, otp });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setOtp('');
    }
  };

  const handleResend = async () => {
    try {
      const result = await resendOtp.mutateAsync({ email });
      toast.success('Đã gửi lại mã OTP mới!');
      setCountdown(result.resendCooldown || 60);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBackClick = () => {
    router.push('/signup');
  };

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl border-none max-h-full overflow-y-auto scrollbar-hide">
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
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-none max-h-full overflow-y-auto scrollbar-hide">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-center">Mã OTP</label>
            <div className="flex justify-center gap-2">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 text-2xl font-bold border-2 rounded-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendOtp.isPending || countdown > 0}
                className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 font-medium"
              >
                {countdown > 0
                  ? `Gửi lại sau ${countdown}s`
                  : resendOtp.isPending
                    ? 'Đang gửi lại...'
                    : 'Gửi lại mã OTP'}
              </button>
            </div>
          </div>

          <AppButton
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={verifyOtp.isPending || otp.length !== 6}
            loading={verifyOtp.isPending}
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
  );
}

export function VerifyOtpPageClient() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
