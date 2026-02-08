import { axiosBaseQuery } from "@/lib/nestjs-client-api";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface SearchSource {
    title: string;
    bookId?: string;
    chapterTitle?: string;
    type: 'book' | 'chapter';
}

interface ChatResponse {
    question: string;
    answer: string;
    sources: SearchSource[];
}

interface ChatRequest {
    question: string;
}

export const chatBotApi = createApi({
    reducerPath: "chatBotApi",
    baseQuery: axiosBaseQuery(),
    endpoints: (builder) => ({
        askChatbot: builder.mutation<ChatResponse, ChatRequest>({
            query: (body) => ({
                url: '/chroma/chat/ask',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useAskChatbotMutation,
} = chatBotApi;


