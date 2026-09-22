import { apiRequest } from '@/lib/nestjs-client-api';

export interface SearchSource {
  title: string;
  bookId?: string;
  bookSlug?: string;
  chapterTitle?: string;
  type: 'book' | 'chapter';
}

export interface ChatResponse {
  question: string;
  answer: string;
  sources: SearchSource[];
}

export interface ChatRequest {
  question: string;
}

export function askChatbot(body: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>({
    url: '/chroma/chat/ask',
    method: 'POST',
    data: body,
  });
}