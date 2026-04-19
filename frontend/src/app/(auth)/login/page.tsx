'use client';

import {
  LoginFormValues,
  loginSchema,
} from '@/features/auth/types/auth.type';
import { useLoginFlow } from '@/features/auth/hooks/useLoginFlow';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AppButton } from '@/components/common/AppButton';
import { AppLoading } from '@/components/common/AppLoading';
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
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    isLoading,
    serverError,
    showPassword,
    setServerError,
    setShowPassword,
    handleSubmit,
    handleGoogleSignin,
    handleErrorFromParams,
  } = useLoginFlow();

  useEffect(() => {
    handleErrorFromParams();
  }, [handleErrorFromParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    handleSubmit(data);
  };

  const handleGoogleSigninWrapper = () => {
    handleGoogleSignin();
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <Image
          src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
          alt="Login background"
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
            <p className="text-2xl text-primary-foreground/90 font-serif italic border-l-4 border-primary pl-4">
              "Even the darkest night will end and the sun will rise."
            </p>
            <p className="mt-4 text-lg font-medium">— Victor Hugo</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-zinc-950">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">Đăng Nhập</CardTitle>
            <CardDescription className="text-base">
              Chào mừng bạn trở lại với thư viện sách trực tuyến
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {serverError}
              </div>
            )}

            <AppButton
              variant="outline"
              type="button"
              onClick={handleGoogleSigninWrapper}
              disabled={isLoading}
              loading={false}
              className="w-full py-6 text-base font-medium relative"
              aria-label="Đăng nhập bằng Google"
            >
              {!isLoading && (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Đăng nhập bằng Google
            </AppButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc đăng nhập bằng email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between items-center">
                        Mật khẩu
                        <Link
                          href="/forgot-password"
                          className="text-xs font-medium text-primary hover:underline tabindex={-1}"
                        >
                          Quên mật khẩu?
                        </Link>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-11 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
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
                  className="w-full h-11 text-base font-semibold mt-2"
                  disabled={isLoading}
                  loading={isLoading}
                  loadingText="Đang đăng nhập..."
                >
                  Đăng nhập
                </AppButton>
              </form>
            </Form>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">Chưa có tài khoản? </span>
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Tạo tài khoản ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
