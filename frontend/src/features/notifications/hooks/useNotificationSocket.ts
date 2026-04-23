import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
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
}

type SocketEventHandler = (data: NotificationItem[]) => void;

interface UseNotificationSocketOptions {
    onNotificationList: SocketEventHandler;
    onNewNotification: (notification: NotificationItem) => void;
    onReadNotification: (data: { id: string }) => void;
}

export function useNotificationSocket(
    userToken: string | undefined,
    options: UseNotificationSocketOptions
) {
    const socketRef = useRef<Socket | null>(null);
    const prevTokenRef = useRef<string | undefined>(undefined);
    const { onNotificationList, onNewNotification, onReadNotification } = options;

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
    }, []);

    useEffect(() => {
        if (userToken === prevTokenRef.current) return;
        prevTokenRef.current = userToken;

        if (!userToken) {
            disconnect();
            return;
        }

        disconnect();

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
        const cleanToken = userToken.startsWith('Bearer ') ? userToken.substring(7) : userToken;

        console.log(`--- [Socket] Đang kết nối tới: ${socketUrl}/notifications ---`);

        const socketInstance = io(`${socketUrl}/notifications`, {
            auth: { token: cleanToken },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('--- [Socket] Kết nối thành công! ---');
            socketInstance.emit('notification:list', (data: NotificationItem[]) => {
                console.log('--- [Socket] Đã nạp danh sách thông báo ---', data);
                onNotificationList(data);
            });
        });

        socketInstance.on('notification:new', (payload: NotificationItem) => {
            console.log('--- [Socket] Có thông báo mới! ---', payload);
            onNewNotification(payload);
        });

        socketInstance.on('notification:read', (data: { id: string }) => {
            onReadNotification(data);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('--- [Socket] Lỗi kết nối: ---', err.message);
        });

        return () => {
        };
    }, [userToken, disconnect, onNotificationList, onNewNotification, onReadNotification]);

    const markAsRead = useCallback((id: string) => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit('notification:markRead', { id }, (res: any) => {
            console.log('Mark read response:', res);
        });
    }, []);

    const refetch = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit('notification:list', (data: NotificationItem[]) => {
            onNotificationList(data);
        });
    }, [onNotificationList]);

    const createNotification = useCallback((dto: NotificationItem) => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit('createNotification', dto, (res: any) => {
            console.log('Notification created:', res);
        });
    }, []);

    return {
        markAsRead,
        refetch,
        createNotification,
        isConnected: !!socketRef.current,
    };
}
