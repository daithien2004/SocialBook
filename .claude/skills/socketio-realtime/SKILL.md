---
name: socketio-realtime
description: Socket.IO real-time patterns for NestJS gateways and Next.js client. Covers namespace-based WebSocket communication, JWT-authenticated connections, room management, and frontend provider patterns. Triggers on tasks involving gateways, Socket.IO, WebSocket, notifications., reading-room, or real-time features.
---

# Socket.IO Real-Time Patterns

## Overview

This project uses **Socket.IO namespaces** for real-time communication. Each domain gets its own namespace (`/notifications`, `/reading-room`). The backend uses `@nestjs/websockets`, the frontend uses `socket.io-client` with a shared `SocketProvider`.

## Trigger

Activate when working on:
- WebSocket gateways (`*.gateway.ts`)
- Socket.IO event handlers (`@SubscribeMessage`)
- Real-time notifications or reading room interactions
- Frontend socket connections (`SocketProvider`, `useSocketEvents`)
- JWT-based socket authentication

## Backend: NestJS Gateway Patterns

### Directory & Convention

```
backend/src/presentation/gateways/
├── notifications.gateway.ts       # Namespace: /notifications
├── reading-room.gateway.ts         # Namespace: /reading-room
├── notification.worker.ts          # BullMQ-to-Socket bridge
├── audio.worker.ts                 # Same for TTS progress
└── socket-token.util.ts            # JWT extraction helper
```

### Gateway Structure

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { accessTokenFromSocket } from './socket-token.util';

interface SocketData {
  userId: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  maxHttpBufferSize: 1e6, // 1 MB
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
  ) {}

  // ─── Lifecycle ───────────────────────────

  afterInit() {
    // If using an external service to emit, inject it here
    // this.notificationsService.setServer(this.server);
  }

  handleConnection(socket: Socket) {
    try {
      const token = accessTokenFromSocket(socket);
      if (typeof token !== 'string' || !token) {
        this.logger.warn('No token, disconnect');
        socket.disconnect(true);
        return;
      }

      const payload = this.jwt.verify<{ sub?: string; id?: string }>(token, {
        complete: false,
      });
      const userId = payload.sub ?? payload.id;
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      (socket.data as SocketData).userId = userId;
      void socket.join(`user:${userId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('expired') || message.includes('invalid')) {
        this.logger.warn(`WS connection rejected (token issue): ${message}`);
      } else {
        this.logger.error(`WS error in handleConnection: ${message}`);
      }
      socket.disconnect(true);
    }
  }

  handleDisconnect() {
    // Cleanup per-user state if needed
  }

  // ─── Events ──────────────────────────────

  @SubscribeMessage('notification:list')
  async list(@ConnectedSocket() socket: Socket) {
    const userId = (socket.data as SocketData).userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @SubscribeMessage('notification:markRead')
  async markRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { id: string },
  ) {
    const userId = (socket.data as SocketData).userId;
    return this.notificationsService.markRead(userId, body.id);
  }
}
```

### Key Conventions

- **Namespace isolation**: Each feature gets its own namespace (`/notifications`, `/reading-room`). No global `@WebSocketGateway()` without a namespace.
- **JWT auth in `handleConnection`**: Extract token via `accessTokenFromSocket()` (reads from `auth.token` handshake query), verify with `JwtService`, join `user:{userId}` room. Use `socket.data` typed as `SocketData`.
- **No `@WebSocketGateway() opts without namespace** — always specify one to avoid cross-feature collisions.
- **Severity-graded logging**: Token expired = `warn`, unexpected errors = `error`. Don't flood `error` on expected auth failures.
- **Event naming**: `feature:action` (e.g. `notification:list`, `reading-room:join`).

### Emitting to Clients

```typescript
// From a service or external system:
this.server.to(`user:${userId}`).emit('notification:new', payload);

// Broadcasting to a room:
this.server.to(`reading-room:${roomId}`).emit('reading-room:activity', data);
```

### BullMQ-to-Socket Bridge (Worker Pattern)

For async job results, use a worker that receives the queue job then emits via the gateway's server:

```typescript
// notification.worker.ts — @Processor('notifications')
process(job: Job) {
  switch (job.name) {
    case 'send.notification':
      this.server.to(`user:${job.data.userId}`).emit('notification:new', job.data);
      break;
  }
}
```

## Frontend: Socket.IO Client Patterns

### SocketProvider

Wrap your app root with `SocketProvider` which manages a single `Manager` and per-namespace sockets:

```typescript
'use client';

// frontend/src/context/SocketProvider.tsx
import { createContext, useContext, useRef, useCallback } from 'react';
import { Manager, Socket } from 'socket.io-client';
import { env } from '@/env';

interface SocketContextType {
  getSocket: (namespace: string) => Socket;
  connectSocket: (namespace: string) => Promise<Socket | null>;
  disconnectAll: () => void;
}

const SOCKET_URL = env.NEXT_PUBLIC_SOCKET_URL === '/'
  ? window.location.origin
  : env.NEXT_PUBLIC_SOCKET_URL;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const managerRef = useRef<Manager | null>(null);
  const socketsRef = useRef<Record<string, Socket>>({});

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new Manager(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
      });
    }
    return managerRef.current;
  }, []);

  const getSocket = useCallback((namespace: string): Socket => {
    if (socketsRef.current[namespace]) return socketsRef.current[namespace];
    const socket = getManager().socket(namespace);
    socketsRef.current[namespace] = socket;
    return socket;
  }, [getManager]);

  const connectSocket = useCallback(async (namespace: string) => {
    const socket = getSocket(namespace);
    if (!socket.connected) socket.connect();
    return socket;
  }, [getSocket]);

  const disconnectAll = useCallback(() => {
    Object.values(socketsRef.current).forEach(s => s.disconnect());
    socketsRef.current = {};
    managerRef.current = null;
  }, []);

  // Auto-disconnect on logout
  // useEffect(() => { if (!isAuthenticated) disconnectAll(); }, [isAuthenticated, disconnectAll]);

  return (
    <SocketContext.Provider value={{ getSocket, connectSocket, disconnectAll }}>
      {children}
    </SocketContext.Provider>
  );
};
```

### Feature Hook Pattern

```typescript
// frontend/src/features/notifications/hooks/useNotificationSocket.ts
export function useNotificationSocket() {
  const { getSocket, connectSocket } = useSocket();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket('/notifications');
    socketRef.current = socket;
    connectSocket('/notifications');
    return () => { socket.disconnect(); };
  }, [getSocket, connectSocket]);

  // Listen for events
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const handler = (data: NotificationPayload) => { /* handle */ };
    s.on('notification:new', handler);
    return () => { s.off('notification:new', handler); };
  }, []);
}
```

### `useSocketEvents` Hook

Use `frontend/src/hooks/useSocketEvents.ts` for a reusable listener pattern.

## Error Handling & Resilience

- **Backend**: `handleConnection` wraps JWT verify in try/catch — disconnect gracefully on any failure.
- **Backend**: Never throw from `handleConnection` — always `socket.disconnect(true)`.
- **Frontend**: `Manager` configures automatic reconnection (5 attempts, exponential backoff starting at 1s). No manual reconnect logic needed.
- **Frontend**: `disconnectAll()` on logout prevents stale listeners.
- **Auth**: Socket auth token is validated on every connection — no session replay without re-auth.

## Security Notes

- `maxHttpBufferSize: 1e6` prevents large-payload DoS.
- `cors.origin` locked from `FRONTEND_URL` env, not `*`.
- All rooms are `user:${userId}` — never join a room the user shouldn't access without server-side verification on each event.
- Token expiry/validation on every `handleConnection`, not cached.