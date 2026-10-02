'use client';

import { getErrorMessage } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  useForgotPassword,
  useResendOtp,
  useResetPassword,
} from '@/features/auth/api/auth.mutations';
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/types/auth.type';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordInput } from '@/components/ui/password-input';
import { AppButton } from '@/components/shared/AppButton';
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

export function ForgotPasswordPageClient() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const resendOtp = useResendOtp();

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

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await resetPassword.mutateAsync({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      setStep('email');
      form.reset();
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSendOtp = async () => {
    const isEmailValid = await form.trigger('email');
    if (!isEmailValid) return;
    const email = form.getValues('email');
    try {
      await forgotPassword.mutateAsync({ email });
      form.setValue('otp', '');
      setStep('otp');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleResendOtp = async () => {
    const email = form.getValues('email');
    if (!email) return;
    try {
      await resendOtp.mutateAsync({ email });
      toast.success('Đã gửi lại mã OTP mới thành công.');
      form.setValue('otp', '');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBackClick = () => {
    forgotPassword.reset();
    resetPassword.reset();
    resendOtp.reset();
    if (step === 'otp') {
      setStep('email');
    } else {
      router.push('/login');
    }
  };

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
        <Form {...form}>
          <form onSubmit={(e) => {
            if (step === 'email') {
              e.preventDefault();
              void handleSendOtp();
            } else {
              void form.handleSubmit(onSubmit)(e);
            }
          }} className="space-y-4">
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
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-4"
                  disabled={forgotPassword.isPending}
                  loading={forgotPassword.isPending}
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-center">Mã OTP</FormLabel>
                      <div className="flex justify-center gap-2">
                        <FormControl>
                          <InputOTP maxLength={6} value={field.value} onChange={field.onChange} autoFocus>
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
                        </FormControl>
                      </div>
                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendOtp.isPending}
                          className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 font-medium"
                        >
                          {resendOtp.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP mới'}
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
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
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
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AppButton
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-4"
                  disabled={resetPassword.isPending}
                  loading={resetPassword.isPending}
                  loadingText="Đang đặt lại mật khẩu..."
                >
                  Đặt Lại Mật Khẩu
                </AppButton>
              </>
            )}
          </form>
        </Form>



        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Đã nhớ mật khẩu? </span>
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
