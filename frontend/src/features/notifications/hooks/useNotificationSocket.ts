import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketProvider';
import { useSocketEvents } from '@/hooks/useSocketEvents';

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

    useSocketEvents(socket, {
        'connect': () => {
            if (socket) {
                socket.emit('notification:list', (data: NotificationItem[]) => {
                    onNotificationList(data);
                });
            }
        },
        'notification:new': (payload: NotificationItem) => {
            onNewNotification(payload);
        },
        'notification:read': (data: { id: string }) => {
            onReadNotification(data);
        },
        'connect_error': () => {
            console.log('Kết nối thông báo thất bại');
        }
    }, [onNotificationList, onNewNotification, onReadNotification]);

    useEffect(() => {
        if (!userToken) return;

        const init = async () => {
            const s = await connectSocket('/notifications');
            if (s && s.connected) {
                s.emit('notification:list', (data: NotificationItem[]) => {
                    onNotificationList(data);
                });
            }
        };

        init();
    }, [userToken, connectSocket, onNotificationList]);

    const markAsRead = useCallback((id: string) => {
        if (!socket?.connected) return;

        socket.emit('notification:markRead', { id });
    }, [socket]);

    const refetch = useCallback(() => {
        if (!socket?.connected) return;

        socket.emit('notification:list', (data: NotificationItem[]) => {
            onNotificationList(data);
        });
    }, [socket, onNotificationList]);

    const createNotification = useCallback((dto: NotificationItem) => {
        if (!socket?.connected) return;

        socket.emit('createNotification', dto);
    }, [socket]);

    return {
        markAsRead,
        refetch,
        createNotification,
        isConnected: !!socket?.connected,
    };
}
