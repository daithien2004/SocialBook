import { NESTJS_CHROMA_ENDPOINTS } from "@/src/constants/server-endpoints";
import { axiosBaseQuery } from "@/src/lib/nestjs-client-api";
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
                url: NESTJS_CHROMA_ENDPOINTS.askChatbot,
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useAskChatbotMutation,
} = chatBotApi;