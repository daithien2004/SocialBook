'use client';

import { useSignup } from '@/features/auth/api/auth.mutations';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  SignupFormValues,
  signupSchema,
} from '@/features/auth/types/auth.type';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { AppButton } from '@/components/shared/AppButton';
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
import { PasswordInput } from '@/components/ui/password-input';

export function SignupPageClient() {
  const router = useRouter();
  const signup = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup.mutateAsync(data);
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-none max-h-full overflow-y-auto scrollbar-hide">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold tracking-tight">Tạo Tài Khoản</CardTitle>
        <CardDescription className="text-base">
          Tham gia cộng đồng yêu sách của chúng tôi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên người dùng</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="thungly123"
                      autoComplete="username"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="thungly@gmail.com"
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
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
              loading={signup.isPending}
              loadingText="Đang tạo tài khoản..."
            >
              Tạo Tài Khoản
            </AppButton>
          </form>
        </Form>

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
