'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';

interface UseAuthRedirectOptions {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    loginUrl?: string;
}

export function useAuthRedirect({
    isOpen,
    onClose,
    message = 'Vui lòng đăng nhập để sử dụng tính năng này',
    loginUrl = '/login',
}: UseAuthRedirectOptions) {
    const { isAuthenticated } = useAppAuth();

    useEffect(() => {
        if (isOpen && !isAuthenticated) {
            toast.info(message, {
                action: {
                    label: 'Đăng nhập',
                    onClick: () => {
                        window.location.href = loginUrl;
                    },
                },
            });
            onClose();
        }
    }, [isOpen, isAuthenticated, message, loginUrl, onClose]);

    return {
        isAuthenticated,
        shouldRender: isOpen && isAuthenticated,
    };
}
