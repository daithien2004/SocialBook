// src/components/notifications/useNotifications.ts
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export type NotificationItem = {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    meta?: any;
};

export function useNotifications(userToken: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!userToken) {
            // nếu user logout hoặc chưa có token -> ngắt kết nối
            socketRef.current?.disconnect();
            socketRef.current = null;
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // 🔌 luôn reconnect mỗi khi token thay đổi
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
            // console.log("WS connected:", socketInstance.id);

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
            // Nếu backend emit TOKEN_EXPIRED thì ở đây bạn có thể gọi getSession()
            // để trigger NextAuth refresh, rồi token mới sẽ chạy vào hook này.
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

    return { notifications, unreadCount, markAsRead, refetch };
}
