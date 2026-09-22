import { useMutation } from '@tanstack/react-query';
import { askChatbot } from './chatBot.api';
import type { ChatRequest, ChatResponse } from './chatBot.api';

export function useAskChatbot() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: askChatbot,
  });
}