// src/components/notifications/useNotifications.ts
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export type NotificationItem = {
    id: string;
    userId: string;
    title: string;
    message: string;
    type:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'system'
    | 'message'
    | 'comment'
    | 'reply'
    | 'like'
    | 'follow';
    isRead: boolean;
    createdAt: string;
    actionUrl: string | null;
    meta: {
        actorId: string;
        name: string;
        image: string;
        targetId?: string;
    };
};

export function useNotifications(userToken: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const prevTokenRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (userToken === prevTokenRef.current) return;
        prevTokenRef.current = userToken;

        if (!userToken) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Reconnect khi token thay đổi
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socketInstance = io(
            `${process.env.NEXT_PUBLIC_SOCKET_URL}/notifications`,
            {
                auth: { token: userToken },
            }
        );

        socketRef.current = socketInstance;

        socketInstance.on("connect", () => {
            socketInstance.emit("notification:list", (data: NotificationItem[]) => {
                setNotifications(data);
                setUnreadCount(data.filter((n) => !n.isRead).length);
            });
        });

        socketInstance.on("notification:new", (payload: NotificationItem) => {
            setNotifications((prev) => [payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        socketInstance.on("notification:read", ({ id }: { id: string }) => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });

        socketInstance.on("error", (err: any) => {
            console.log("WS error:", err);
        });

        return () => {
            socketInstance.disconnect();
            socketRef.current = null;
        };
    }, [userToken]);

    const markAsRead = (id: string) => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("notification:markRead", { id }, (res: any) => {
            // tùy bạn: có thể check res.ok === true
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });
    };

    const refetch = () => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("notification:list", (data: NotificationItem[]) => {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.isRead).length);
        });
    };

    const createNotification = (dto: NotificationItem) => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("createNotification", dto, (res: any) => {
            console.log("Notification created:", res);
        });
    };

    return { notifications, unreadCount, markAsRead, refetch, createNotification };
}
