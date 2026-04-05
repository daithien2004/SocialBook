'use client';

import { useMemo } from 'react';
import { Facebook, Twitter, Mail } from 'lucide-react';
import {
    FacebookShareButton,
    TwitterShareButton,
    EmailShareButton,
} from 'next-share';

interface UseProfileShareProps {
    userId: string;
    title?: string;
}

interface ShareButton {
    button: React.ReactNode;
    label: string;
}

export function useProfileShare({ userId, title = 'Xem hồ sơ người dùng này' }: UseProfileShareProps) {
    const profileUrl = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/users/${userId}`;
    }, [userId]);

    const shareButtons: ShareButton[] = useMemo(() => [
        {
            button: (
                <FacebookShareButton url={profileUrl} quote={title}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b5998] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                        <Facebook className="h-4 w-4" />
                    </div>
                </FacebookShareButton>
            ),
            label: 'Facebook',
        },
        {
            button: (
                <TwitterShareButton url={profileUrl} title={title}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1da1f2] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                        <Twitter className="h-4 w-4" />
                    </div>
                </TwitterShareButton>
            ),
            label: 'Twitter',
        },
        {
            button: (
                <EmailShareButton url={profileUrl} subject={title}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f96a0e] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                        <Mail className="h-4 w-4" />
                    </div>
                </EmailShareButton>
            ),
            label: 'Email',
        },
    ], [profileUrl, title]);

    return {
        profileUrl,
        shareButtons,
    };
}
