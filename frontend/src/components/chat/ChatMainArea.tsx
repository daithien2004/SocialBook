'use client';

import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message } from '@/features/chat/types';

interface ChatMainAreaProps {
    currentRoom: string | null;
    recipient: string | null;
    typingUsers: string[];
    messages: Message[];
    socketId: string | null;
    input: string;
    currentUser: {
        id: string;
        username: string;
        image?: string;
    } | null;
    onLeaveRoom: () => void;
    onInputChange: (value: string) => void;
    onSendMessage: (e?: React.FormEvent) => void;
    onMessageVisible: (messageId: string) => void;
}

export function ChatMainArea({
    currentRoom,
    recipient,
    typingUsers,
    messages,
    socketId,
    input,
    currentUser,
    onLeaveRoom,
    onInputChange,
    onSendMessage,
    onMessageVisible,
}: ChatMainAreaProps) {
    const hasActiveChat = currentRoom || recipient;

    return (
        <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
            {!hasActiveChat ? (
                <EmptyChatState />
            ) : (
                <>
                    <ChatHeader
                        currentRoom={currentRoom}
                        recipient={recipient}
                        typingUsers={typingUsers}
                        onLeaveRoom={onLeaveRoom}
                        currentUser={currentUser}
                    />
                    <MessageList
                        messages={messages}
                        socketId={socketId}
                        currentRoom={currentRoom}
                        onMessageVisible={onMessageVisible}
                    />
                    <div className="p-4 bg-white dark:bg-zinc-950 border-t dark:border-zinc-800">
                        <ChatInput
                            value={input}
                            onChange={onInputChange}
                            onSubmit={onSendMessage}
                        />
                    </div>
                </>
            )}
        </Card>
    );
}

function EmptyChatState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/30 dark:bg-zinc-900/10">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <MessageCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold dark:text-white">Bắt đầu cuộc trò chuyện</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
                Chọn một người bạn hoặc tham gia phòng để cùng thảo luận về sách.
            </p>
        </div>
    );
}
