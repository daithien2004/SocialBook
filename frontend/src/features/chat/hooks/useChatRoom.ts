import { useCallback, useState } from 'react';
import debounce from 'lodash.debounce';
import type { Message } from '../types/message.types';

interface UseChatRoomOptions {
  socketId?: string | null;
  onSendMessage: (payload: { room?: string; to?: string; text: string }) => void;
  onSendTyping: (payload: { room?: string; to?: string; isTyping: boolean }) => void;
}

interface UseChatRoomReturn {
  currentRoom: string | null;
  recipient: string | null;
  joinRoom: (roomName: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export function useChatRoom(options: UseChatRoomOptions): UseChatRoomReturn {
  const { socketId, onSendMessage, onSendTyping } = options;
  
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);

  const joinRoom = useCallback((roomName: string) => {
    setCurrentRoom(roomName);
    setRecipient(null);
  }, []);

  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
  }, []);

  const setRecipientOnly = useCallback((user: string) => {
    setRecipient(user);
    setCurrentRoom(null);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const payload = currentRoom
        ? { room: currentRoom, text }
        : { to: recipient ?? undefined, text };
      onSendMessage(payload);
    },
    [currentRoom, recipient, onSendMessage]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const payload = currentRoom
        ? { room: currentRoom, isTyping }
        : { to: recipient ?? undefined, isTyping };
      onSendTyping(payload);
    },
    [currentRoom, recipient, onSendTyping]
  );

  const clearMessages = useCallback(() => {
    // Messages will be cleared by the socket hook
  }, []);

  return {
    currentRoom,
    recipient,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    clearMessages,
  };
}

export function useDebouncedTyping(
  callback: (isTyping: boolean) => void,
  delay: number = 500
) {
  return useCallback(
    debounce((isTyping: boolean) => {
      callback(isTyping);
    }, delay),
    [callback]
  );
}
