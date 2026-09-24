import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginFormValues } from '@/features/auth/types/auth.type';
import { queryClient } from '@/lib/query-client';
import { mapOAuthError } from '@/lib/map-oauth-error';
import { useAppSession } from '@/lib/app-session';
import { getErrorMessage } from '@/lib/utils';

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
    handleOAuthSuccess: () => void;
} {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refetch } = useAppSession();

    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthRedirect = useCallback(async () => {
        const me = await refetch();
        void me;
        router.push('/');
    }, [router, refetch]);

    const handleSubmit = useCallback(async (data: LoginFormValues) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, password: data.password }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => ({}))) as {
                    message?: string;
                };
                throw new Error(getErrorMessage(payload));
            }

            queryClient.clear();
            await handleAuthRedirect();
        } catch (error) {
            setServerError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthRedirect]);

    const handleErrorFromParams = useCallback(() => {
        const error = searchParams.get('error');
        if (error) {
            setServerError(mapOAuthError(error));
            router.replace('/login');
        }
    }, [searchParams, router]);

const handleGoogleSignin = useCallback(() => {
    router.push('/api/auth/google');
  }, [router]);

    const handleOAuthSuccess = useCallback(() => {
        if (searchParams.get('oauth') === 'success') {
            router.replace('/');
        }
    }, [router, searchParams]);

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
        handleOAuthSuccess,
    };
}