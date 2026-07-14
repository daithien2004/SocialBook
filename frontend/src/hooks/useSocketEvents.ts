import { useEffect, useRef } from 'react';

interface SocketLike {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

export function useSocketEvents(
  socket: SocketLike | null | undefined,
  events: Record<string, (...args: unknown[]) => void>,
) {
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    if (!socket) return;

    const currentEvents = eventsRef.current;
    Object.entries(currentEvents).forEach(([eventName, handler]) => {
      socket.on(eventName, handler);
    });

    return () => {
      Object.entries(currentEvents).forEach(([eventName, handler]) => {
        socket.off(eventName, handler);
      });
    };
  }, [socket]);
}
