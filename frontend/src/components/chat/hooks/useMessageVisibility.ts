'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseMessageVisibilityOptions {
    messages: { messageId: string }[];
    onMessageVisible: (messageId: string) => void;
}

export function useMessageVisibility({ messages, onMessageVisible }: UseMessageVisibilityOptions) {
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const setMessageRef = useCallback((messageId: string, el: HTMLDivElement | null) => {
        if (el) {
            messageRefs.current.set(messageId, el);
        } else {
            messageRefs.current.delete(messageId);
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.getAttribute('data-message-id');
                        if (messageId) {
                            onMessageVisible(messageId);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        messageRefs.current.forEach((ref) => observer.observe(ref));
        return () => observer.disconnect();
    }, [messages, onMessageVisible]);

    return {
        messageRefs,
        setMessageRef,
    };
}
