import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api/auth.api';
import { LoginFormValues } from '@/features/auth/types/auth.type';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';
import { getErrorMessage } from '@/lib/utils';

export interface UseLoginResult {
    serverError: string | null;
    setServerError: (error: string | null) => void;
    handleLogin: (data: LoginFormValues) => Promise<void>;
}

export function useLogin(): UseLoginResult {
    const router = useRouter();
    const { refetch } = useAppSession();

    const [serverError, setServerError] = useState<string | null>(null);

    const handleLogin = useCallback(async (data: LoginFormValues) => {
        setServerError(null);
        try {
            await login({
                email: data.email,
                password: data.password
            });

            queryClient.clear();
            const me = await refetch();
            void me;
            router.push('/');
        } catch (error) {
            setServerError(getErrorMessage(error));
        }
    }, [router, refetch]);

    return {
        serverError,
        setServerError,
        handleLogin,
    };
}
