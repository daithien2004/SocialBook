import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

interface UseChatWidgetOptions {
    askChatbot: (params: { question: string }) => Promise<{ answer: string }>;
    isAuthenticated: boolean;
}

export interface UseChatWidgetResult {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    isOpen: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    setInput: (input: string) => void;
    setIsOpen: (open: boolean) => void;
    handleSendMessage: () => Promise<void>;
}

export function useChatWidget({ askChatbot, isAuthenticated }: UseChatWidgetOptions): UseChatWidgetResult {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: 'Xin chào! Tôi là trợ lý ảo AI. Bạn cần tìm sách gì hôm nay?',
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formatAIResponse = useCallback((text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(
                /#{1,6}\s+(.+)/g,
                '<div class="font-semibold text-base mt-2 mb-1">$1</div>'
            )
            .replace(
                /^\s*(\d+)\.\s+/gm,
                '<div class="mt-3 mb-1 font-medium">$1.</div>'
            )
            .replace(/^\s*[-•]\s+/gm, '<span class="inline-block mr-1">•</span>');
    }, []);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim()) return;

        const userText = input;
        setInput('');

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userText,
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
            setIsLoading(true);
            const data = await askChatbot({ question: userText });

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: formatAIResponse(data.answer),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error: unknown) {
            const isRateLimited = (error as { status?: number })?.status === 429;

            if (isRateLimited && !isAuthenticated) {
                toast('Bạn đã hết lượt chat. Đăng nhập để chat không giới hạn!', {
                    action: {
                        label: 'Đăng nhập',
                        onClick: () => window.location.href = '/login',
                    },
                    duration: 5000,
                });
                const rateLimitMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: 'Bạn đã hết lượt chat. Vui lòng đăng nhập để tiếp tục trò chuyện!',
                };
                setMessages((prev) => [...prev, rateLimitMsg]);
            } else {
                toast.error('Không thể kết nối đến trợ lý. Vui lòng thử lại.');
                const errorMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
                };
                setMessages((prev) => [...prev, errorMsg]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [input, askChatbot, formatAIResponse, isAuthenticated]);

    return {
        messages,
        input,
        isLoading,
        isOpen,
        messagesEndRef,
        setInput,
        setIsOpen,
        handleSendMessage,
    };
}
