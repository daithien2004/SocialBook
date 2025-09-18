'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SignupFormData,
  signupSchema,
  LoginFormData,
  loginSchema,
} from '@/lib/validation';
import { useMutation } from '@tanstack/react-query';
import { signup, login } from '@/lib/api';
import { useAppDispatch } from '@/hooks/use-app-dispatch';
import { setAccessToken } from '@/lib/auth-slice';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  type: 'signup' | 'login';
}

export default function AuthForm({ type }: AuthFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const schema = type === 'signup' ? signupSchema : loginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData | LoginFormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: type === 'signup' ? signup : login,
    onSuccess: (data) => {
      dispatch(setAccessToken(data.accessToken));
      router.push('/dashboard'); // Chuyển hướng đến tuyến đường được bảo vệ
    },
    onError: (error) => {
      console.error(`Lỗi ${type}:`, error);
      // Hiển thị lỗi cho người dùng (ví dụ: thông báo toast)
    },
  });

  const onSubmit = (data: SignupFormData | LoginFormData) => {
    mutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md mx-auto p-6"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isPending
          ? 'Đang tải...'
          : type === 'signup'
          ? 'Đăng ký'
          : 'Đăng nhập'}
      </button>
    </form>
  );
}
