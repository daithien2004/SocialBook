'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { Manager, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/token-store';
import { useAppAuth } from '@/features/auth/hooks';

interface SocketContextType {
  /**
   * Lấy hoặc tạo một socket cho namespace cụ thể.
   * Namespace phải bắt đầu bằng dấu / (ví dụ: '/notifications')
   */
  getSocket: (namespace: string) => Socket;
  /**
   * Kết nối một namespace cụ thể với token hiện tại
   */
  connectSocket: (namespace: string) => Promise<Socket | null>;
  /**
   * Ngắt kết nối tất cả các socket và manager
   */
  disconnectAll: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

let SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

if (typeof window !== 'undefined' && SOCKET_URL === '/') {
  SOCKET_URL = window.location.origin;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const managerRef = useRef<Manager | null>(null);
  const socketsRef = useRef<Record<string, Socket>>({});
  const { isAuthenticated } = useAppAuth();

  // Khởi tạo Manager nếu chưa có
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new Manager(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    return managerRef.current;
  }, []);

  const getSocket = useCallback((namespace: string): Socket => {
    if (socketsRef.current[namespace]) {
      return socketsRef.current[namespace];
    }

    const manager = getManager();
    const socket = manager.socket(namespace);
    socketsRef.current[namespace] = socket;

    return socket;
  }, [getManager]);

  const connectSocket = useCallback(async (namespace: string) => {
    const token = getAccessToken();

    if (!token) {
      return null;
    }

    const socket = getSocket(namespace);

    // Dùng function để Socket.IO tự động lấy token mới nhất mỗi lần (re)connect
    socket.auth = (cb: (data: Record<string, string>) => void) => {
      cb({ token: getAccessToken() || '' });
    };

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }, [getSocket]);

  const disconnectAll = useCallback(() => {
    Object.values(socketsRef.current).forEach((socket) => {
      socket.disconnect();
    });
    socketsRef.current = {};
    managerRef.current = null;
  }, []);

  // Tự động ngắt kết nối khi logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectAll();
    }
  }, [isAuthenticated, disconnectAll]);

  return (
    <SocketContext.Provider value={{ getSocket, connectSocket, disconnectAll }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
