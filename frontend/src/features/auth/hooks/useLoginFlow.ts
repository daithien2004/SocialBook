import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/features/auth/api/auth.api';
import { LoginFormValues } from '@/features/auth/types/auth.type';
import { queryClient } from '@/lib/query-client';
import { mapOAuthError } from '@/lib/map-oauth-error';
import { useAppSession } from '@/lib/app-session';
import { getErrorMessage } from '@/lib/utils';

export const GOOGLE_OAUTH_URL = '/api/auth/google?callbackUrl=/';
export const GITHUB_OAUTH_URL = '/api/auth/github?callbackUrl=/';

export interface UseLoginFlowResult {
    isLoading: boolean;
    serverError: string | null;
    showPassword: boolean;
    setServerError: (error: string | null) => void;
    setShowPassword: (show: boolean) => void;
    handleSubmit: (data: LoginFormValues) => Promise<void>;
    handleGoogleSignin: () => void;
    handleGithubSignin: () => void;
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
            await login({
                email: data.email,
                password: data.password
            });

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
        window.location.href = GOOGLE_OAUTH_URL;
    }, []);

    const handleGithubSignin = useCallback(() => {
        window.location.href = GITHUB_OAUTH_URL;
    }, []);

    const handleOAuthSuccess = useCallback(() => {
        if (searchParams.get('oauth') === 'success') {
            queryClient.clear();
            handleAuthRedirect();
        }
    }, [searchParams, handleAuthRedirect]);

    return {
        isLoading,
        serverError,
        showPassword,
        setServerError,
        setShowPassword,
        handleSubmit,
        handleGoogleSignin,
        handleGithubSignin,
        handleAuthRedirect,
        handleErrorFromParams,
        handleOAuthSuccess,
    };
}