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
        if (!userToken) return;

        // tránh tạo socket lại nhiều lần
        if (!socketRef.current) {
            const socketInstance = io(
                `${process.env.NEXT_PUBLIC_SOCKET_URL}/notifications`,
                {
                    auth: { token: userToken },
                }
            );

            socketRef.current = socketInstance;

            socketInstance.on("connect", () => {
                console.log("WS connected:", socketInstance.id);

                // 🟢 Lấy danh sách notification lần đầu bằng event `notification:list`
                socketInstance.emit(
                    "notification:list",
                    (data: NotificationItem[]) => {
                        setNotifications(data);
                        setUnreadCount(data.filter((n) => !n.isRead).length);
                    }
                );
            });

            // 🟢 Nhận thông báo mới từ backend
            socketInstance.on("notification:new", (payload: NotificationItem) => {
                setNotifications((prev) => [payload, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });

            // 🟢 (tuỳ) nếu backend có emit "notification:read" thì update theo
            socketInstance.on("notification:read", ({ id }: { id: string }) => {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            });
        }

        return () => {
            // nếu muốn giữ socket sống cả app thì có thể KHÔNG disconnect ở đây,
            // tuỳ kiến trúc của bạn
            // socketRef.current?.disconnect();
            // socketRef.current = null;
        };
    }, [userToken]);

    // 🟢 Gửi yêu cầu mark read qua WebSocket (notification:markRead)
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

    // nếu sau này bạn muốn reload list lại bằng tay
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
