"use client";

import { useState, useCallback } from 'react';
import { useNotificationSocket, NotificationItem } from './useNotificationSocket';

export type { NotificationItem };

export function useNotifications(userToken: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleNotificationList = useCallback((data: NotificationItem[]) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
    }, []);

    const handleNewNotification = useCallback((payload: NotificationItem) => {
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((prev) => prev + 1);
    }, []);

    const handleReadNotification = useCallback(({ id }: { id: string }) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const { markAsRead, refetch, createNotification } = useNotificationSocket(
        userToken,
        {
            onNotificationList: handleNotificationList,
            onNewNotification: handleNewNotification,
            onReadNotification: handleReadNotification,
        }
    );

    const markAsReadLocal = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        markAsRead(id);
    }, [markAsRead]);

    return {
        notifications,
        unreadCount,
        markAsRead: markAsReadLocal,
        refetch,
        createNotification,
    };
}
