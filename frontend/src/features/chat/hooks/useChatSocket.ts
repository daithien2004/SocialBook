'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, TypingState } from '../types/message.types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL + '/chat';

interface UseChatSocketOptions {
  onMessage?: (message: Message) => void;
  onUserList?: (users: string[]) => void;
  onTyping?: (state: TypingState) => void;
  onDeliveryReceipt?: (receipt: { messageId: string; deliveredTo: string[] }) => void;
  onReadReceipt?: (receipt: { messageId: string; readBy: string }) => void;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  messages: Message[];
  users: string[];
  typingUsers: string[];
  sendMessage: (payload: { room?: string; to?: string; text: string }) => void;
  sendTyping: (payload: { room?: string; to?: string; isTyping: boolean }) => void;
  emitDeliveryReceipt: (payload: { messageId: string; room?: string; to?: string }) => void;
  emitReadReceipt: (payload: { messageId: string; room?: string; to?: string }) => void;
  disconnect: () => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
  const { onMessage, onUserList, onTyping, onDeliveryReceipt, onReadReceipt } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token: 'your-jwt-token' },
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => console.log('Connected to socket'));

    newSocket.on('message', (msg: Message) => {
      const enrichedMsg: Message = {
        ...msg,
        readBy: msg.readBy || [],
        deliveredTo: msg.deliveredTo || [],
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, enrichedMsg]);
      onMessage?.(enrichedMsg);
    });

    newSocket.on('userList', (userList: string[]) => {
      setUsers(userList);
      onUserList?.(userList);
    });

    newSocket.on('typing', ({ user, isTyping }: TypingState) => {
      setTypingUsers((prev) =>
        isTyping ? [...new Set([...prev, user])] : prev.filter((u) => u !== user)
      );
      onTyping?.({ user, isTyping });
    });

    newSocket.on('deliveryReceipt', ({ messageId, deliveredTo }: { messageId: string; deliveredTo: string[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, deliveredTo: [...new Set([...(msg.deliveredTo || []), ...deliveredTo])] }
            : msg
        )
      );
      onDeliveryReceipt?.({ messageId, deliveredTo });
    });

    newSocket.on('readReceipt', ({ messageId, readBy }: { messageId: string; readBy: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, readBy: [...new Set([...(msg.readBy || []), readBy])] }
            : msg
        )
      );
      onReadReceipt?.({ messageId, readBy });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [onMessage, onUserList, onTyping, onDeliveryReceipt, onReadReceipt]);

  const sendMessage = useCallback(
    (payload: { room?: string; to?: string; text: string }) => {
      if (socket) {
        socket.emit('message', payload);
      }
    },
    [socket]
  );

  const sendTyping = useCallback(
    (payload: { room?: string; to?: string; isTyping: boolean }) => {
      if (socket) {
        socket.emit('typing', payload);
      }
    },
    [socket]
  );

  const emitDeliveryReceipt = useCallback(
    (payload: { messageId: string; room?: string; to?: string }) => {
      if (socket) {
        socket.emit('deliveryReceipt', payload);
      }
    },
    [socket]
  );

  const emitReadReceipt = useCallback(
    (payload: { messageId: string; room?: string; to?: string }) => {
      if (socket) {
        socket.emit('readMessage', payload);
      }
    },
    [socket]
  );

  const disconnect = useCallback(() => {
    socket?.disconnect();
  }, [socket]);

  return {
    socket,
    messages,
    users,
    typingUsers,
    sendMessage,
    sendTyping,
    emitDeliveryReceipt,
    emitReadReceipt,
    disconnect,
  };
}
