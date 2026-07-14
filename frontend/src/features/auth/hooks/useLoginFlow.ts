import { useState, useCallback } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginFormValues } from '@/features/auth/types/auth.type';

export interface UseLoginFlowResult {
    isLoading: boolean;
    serverError: string | null;
    showPassword: boolean;
    setServerError: (error: string | null) => void;
    setShowPassword: (show: boolean) => void;
    handleSubmit: (data: LoginFormValues) => Promise<void>;
    handleGoogleSignin: () => void;
}

export function useLoginFlow(): UseLoginFlowResult & {
    handleAuthRedirect: () => void;
    handleErrorFromParams: () => void;
} {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthRedirect = useCallback(async () => {
        const sessionData = await getSession();
        const userRole = sessionData?.user?.role;
        if (userRole === 'admin') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = useCallback(async (data: LoginFormValues) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (result?.ok) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                handleAuthRedirect();
            } else {
                setServerError(result?.error || 'Invalid email or password.');
            }
        } catch {
            setServerError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthRedirect]);

    const handleErrorFromParams = useCallback(() => {
        const error = searchParams.get('error');
        if (error) {
            setServerError('Sign in failed. Please try again.');
            router.replace('/login');
        }
    }, [searchParams, router]);

    const handleGoogleSignin = useCallback(() => {
        signIn('google', { redirect: true, callbackUrl: '/' });
    }, []);

    return {
        isLoading,
        serverError,
        showPassword,
        setServerError,
        setShowPassword,
        handleSubmit,
        handleGoogleSignin,
        handleAuthRedirect,
        handleErrorFromParams,
    };
}
