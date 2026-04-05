import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '@/features/chat/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL + '/chat';

interface UseChatSocketOptions {
    onMessage?: (message: Message) => void;
    onUserList?: (users: string[]) => void;
    onTyping?: (data: { user: string; isTyping: boolean }) => void;
    onDeliveryReceipt?: (data: { messageId: string; deliveredTo: string[] }) => void;
    onReadReceipt?: (data: { messageId: string; readBy: string }) => void;
}

interface UseChatSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
}

export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
    const { onMessage, onUserList, onTyping, onDeliveryReceipt, onReadReceipt } = options;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            auth: { token: 'your-jwt-token' },
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('message', (msg: Message) => {
            const enrichedMsg: Message = {
                ...msg,
                readBy: msg.readBy || [],
                deliveredTo: msg.deliveredTo || [],
                timestamp: Date.now(),
            };
            onMessage?.(enrichedMsg);
        });

        newSocket.on('userList', (userList: string[]) => {
            onUserList?.(userList);
        });

        newSocket.on('typing', (data: { user: string; isTyping: boolean }) => {
            onTyping?.(data);
        });

        newSocket.on('deliveryReceipt', (data: { messageId: string; deliveredTo: string[] }) => {
            onDeliveryReceipt?.(data);
        });

        newSocket.on('readReceipt', (data: { messageId: string; readBy: string }) => {
            onReadReceipt?.(data);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [onMessage, onUserList, onTyping, onDeliveryReceipt, onReadReceipt]);

    return { socket, isConnected };
}
