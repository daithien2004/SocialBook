import { useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';

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
    const { getSocket, connectSocket } = useSocket();
    const socket = getSocket('/notifications');
    const { onNotificationList, onNewNotification, onReadNotification } = options;

    useEffect(() => {
        if (!userToken) return;

        const init = async () => {
            const s = await connectSocket('/notifications');
            if (!s) return;

            s.on('connect', () => {
                console.log('--- [Socket] Notifications connected! ---');
                s.emit('notification:list', (data: NotificationItem[]) => {
                    onNotificationList(data);
                });
            });

            s.on('notification:new', (payload: NotificationItem) => {
                onNewNotification(payload);
            });

            s.on('notification:read', (data: { id: string }) => {
                onReadNotification(data);
            });

            s.on('connect_error', (err) => {
                console.error('--- [Socket] Notifications connect error: ---', err.message);
            });

            // Nếu đã connected rồi (multiplexing), chủ động lấy list
            if (s.connected) {
                s.emit('notification:list', (data: NotificationItem[]) => {
                    onNotificationList(data);
                });
            }
        };

        init();

        return () => {
            socket.off('connect');
            socket.off('notification:new');
            socket.off('notification:read');
            socket.off('connect_error');
        };
    }, [userToken, connectSocket, socket, onNotificationList, onNewNotification, onReadNotification]);

    const markAsRead = useCallback((id: string) => {
        if (!socket?.connected) return;

        socket.emit('notification:markRead', { id }, (res: any) => {
            console.log('Mark read response:', res);
        });
    }, [socket]);

    const refetch = useCallback(() => {
        if (!socket?.connected) return;

        socket.emit('notification:list', (data: NotificationItem[]) => {
            onNotificationList(data);
        });
    }, [socket, onNotificationList]);

    const createNotification = useCallback((dto: NotificationItem) => {
        if (!socket?.connected) return;

        socket.emit('createNotification', dto, (res: any) => {
            console.log('Notification created:', res);
        });
    }, [socket]);

    return {
        markAsRead,
        refetch,
        createNotification,
        isConnected: !!socket?.connected,
    };
}
