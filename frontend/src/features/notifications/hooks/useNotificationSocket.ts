import { useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

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
        let isCancelled = false;

        if (userToken === prevTokenRef.current) return;
        prevTokenRef.current = userToken;

        if (!userToken) {
            disconnect();
            return;
        }

        disconnect();

        void import('socket.io-client').then(({ io }) => {
            if (isCancelled) return;

            const socketInstance = io(
                `${process.env.NEXT_PUBLIC_SOCKET_URL}/notifications`,
                { auth: { token: userToken } }
            );

            socketRef.current = socketInstance;

            socketInstance.on('connect', () => {
                socketInstance.emit('notification:list', (data: NotificationItem[]) => {
                    onNotificationList(data);
                });
            });

            socketInstance.on('notification:new', (payload: NotificationItem) => {
                onNewNotification(payload);
            });

            socketInstance.on('notification:read', (data: { id: string }) => {
                onReadNotification(data);
            });

            socketInstance.on('error', (err: any) => {
                console.log('WS error:', err);
            });
        });

        return () => {
            isCancelled = true;
            disconnect();
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
