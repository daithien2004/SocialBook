'use client';

import { getErrorMessage } from '@/lib/utils';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  useForgotPasswordMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
} from '@/features/auth/api/authApi';
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/types/auth.type';

import { AppButton } from '@/components/common/AppButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [resendMessage, setResendMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Lấy state từ các hooks của RTK Query với tên riêng biệt
  const [
    forgotPassword,
    { isLoading: isSendingOtp, error: forgotPasswordError },
  ] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting, error: resetPasswordError }] =
    useResetPasswordMutation();
  const [resendOtp, { isLoading: isResending, error: resendOtpError }] =
    useResendOtpMutation();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    }
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
    const isEmailValid = await form.trigger('email');
    if (!isEmailValid) return;
    const email = form.getValues('email');
    try {
      await forgotPassword({ email }).unwrap();
      setOtpBoxes(['', '', '', '', '', '']);
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { }
  };

  const handleResendOtp = async () => {
    setResendMessage('');
    const email = form.getValues('email');
    if (!email) return;
    try {
      await resendOtp({ email }).unwrap();
      setResendMessage('Đã gửi lại mã OTP mới thành công.');
      setOtpBoxes(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { }
  };

  const handleOtpBoxChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newBoxes = [...otpBoxes];
    newBoxes[index] = value;
    setOtpBoxes(newBoxes);
    form.setValue('otp', newBoxes.join(''));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpBoxPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newBoxes = pasted.split('');
      setOtpBoxes(newBoxes);
      form.setValue('otp', pasted);
      otpRefs.current[5]?.focus();
    }
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

  const apiError = forgotPasswordError || resetPasswordError || resendOtpError;
  const currentError = apiError ? getErrorMessage(apiError) : null;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <Image
          src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
          alt="Background"
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
              &quot;There is nothing like a dream to create the future.&quot;
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

            {step === 'email' && (
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">Quên Mật Khẩu?</CardTitle>
                <CardDescription className="text-base mt-2">
                  Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
                </CardDescription>
              </div>
            )}

            {step === 'otp' && (
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">Đặt Lại Mật Khẩu</CardTitle>
                <CardDescription className="text-base mt-2">
                  Nhập mã OTP đã được gửi đến{' '}
                  <span className="font-medium text-foreground">{form.getValues('email')}</span>
                </CardDescription>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {currentError && (
              <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {currentError}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {step === 'email' && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              type="email"
                              autoComplete="email"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <AppButton
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full h-11 text-base font-semibold mt-4"
                      disabled={isSendingOtp}
                      loading={isSendingOtp}
                      loadingText="Đang gửi mã OTP..."
                    >
                      Gửi Mã OTP
                    </AppButton>
                  </>
                )}

                {step === 'otp' && (
                  <>
                    <FormField
                      control={form.control}
                      name="otp"
                      render={() => (
                        <FormItem>
                          <FormLabel className="block text-sm font-medium text-center">Mã OTP</FormLabel>
                          <div className="flex justify-center gap-2">
                            {otpBoxes.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => { otpRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpBoxKeyDown(index, e)}
                                onPaste={index === 0 ? handleOtpBoxPaste : undefined}
                                className="w-12 h-14 text-2xl font-bold text-center border-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all bg-background"
                                autoFocus={index === 0}
                              />
                            ))}
                          </div>
                          <div className="text-center mt-2">
                            {resendMessage && (
                              <p className="text-green-500 text-xs mb-1">
                                {resendMessage}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={isResending}
                              className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 font-medium"
                            >
                              {isResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP mới'}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu mới</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="h-11 pr-10"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="h-11 pr-10"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <AppButton
                      type="submit"
                      className="w-full h-11 text-base font-semibold mt-4"
                      disabled={isResetting}
                      loading={isResetting}
                      loadingText="Đang đặt lại mật khẩu..."
                    >
                      Đặt Lại Mật Khẩu
                    </AppButton>
                  </>
                )}
              </form>
            </Form>

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Đặt Lại Mật Khẩu Thành Công!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Bạn có thể đăng nhập bằng mật khẩu mới của mình.
                </p>
                <AppButton
                  onClick={handleLoginClick}
                  className="w-full h-11 text-base font-semibold"
                >
                  Đến Trang Đăng Nhập
                </AppButton>
              </div>
            )}

            {step !== 'success' && (
              <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">Đã nhớ mật khẩu? </span>
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
