'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Manager, Socket } from 'socket.io-client';
import { env } from '@/env';
import { useAppAuth } from '@/features/auth/hooks';

interface SocketContextType {
  /**
   * Lấy hoặc tạo một socket cho namespace cụ thể.
   * Namespace phải bắt đầu bằng dấu / (ví dụ: '/notifications')
   */
  getSocket: (namespace: string) => Socket;
  acquireSocket: (namespace: string) => void;
  releaseSocket: (namespace: string) => void;
  disconnectAll: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

let SOCKET_URL = env.NEXT_PUBLIC_SOCKET_URL;

if (typeof window !== 'undefined' && SOCKET_URL === '/') {
  SOCKET_URL = window.location.origin;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const managerRef = useRef<Manager | null>(null);
  const socketsRef = useRef<Record<string, Socket>>({});
  const refCountRef = useRef<Record<string, number>>({});
  const { isAuthenticated } = useAppAuth();

  // Khởi tạo Manager nếu chưa có
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new Manager(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5, // Chống bão Reconnect khi server deploy
        withCredentials: true,
      });
    }
    return managerRef.current;
  }, []);

  const getSocket = useCallback(
    (namespace: string): Socket => {
      if (socketsRef.current[namespace]) {
        return socketsRef.current[namespace];
      }

      const manager = getManager();
      const socket = manager.socket(namespace);

      socket.auth = async (cb) => {
        try {
          const res = await fetch('/api/auth/ws-ticket', { method: 'POST' });
          if (res.status === 401) {
            window.location.href = '/login';
            return cb({ ticket: '' });
          }
          const data = await res.json();
          cb({ ticket: data.ticket || '' });
        } catch (e) {
          cb({ ticket: '' });
        }
      };

      socketsRef.current[namespace] = socket;
      return socket;
    },
    [getManager],
  );

  const acquireSocket = useCallback(
    (namespace: string) => {
      const socket = getSocket(namespace);
      refCountRef.current[namespace] =
        (refCountRef.current[namespace] || 0) + 1;

      if (!socket.connected) {
        socket.connect();
      }
    },
    [getSocket],
  );

  const releaseSocket = useCallback((namespace: string) => {
    if (refCountRef.current[namespace] > 0) {
      refCountRef.current[namespace] -= 1;
    }
    if (refCountRef.current[namespace] === 0 && socketsRef.current[namespace]) {
      socketsRef.current[namespace].disconnect();
      delete socketsRef.current[namespace];
    }
  }, []);

  const disconnectAll = useCallback(() => {
    Object.values(socketsRef.current).forEach((socket) => {
      socket.disconnect();
    });
    socketsRef.current = {};
    refCountRef.current = {};
    managerRef.current = null;
  }, []);

  // Tự động ngắt kết nối khi logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectAll();
    }
  }, [isAuthenticated, disconnectAll]);

  return (
    <SocketContext.Provider
      value={{ getSocket, acquireSocket, releaseSocket, disconnectAll }}
    >
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
