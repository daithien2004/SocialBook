import { useMutation } from '@tanstack/react-query';
import {
  signup,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from './auth.api';

export function useSignup() {
  return useMutation({ mutationFn: signup });
}

export function useVerifyOtp() {
  return useMutation({ mutationFn: verifyOtp });
}

export function useResendOtp() {
  return useMutation({ mutationFn: resendOtp });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}