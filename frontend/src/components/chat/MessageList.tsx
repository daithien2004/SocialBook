'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, CheckCheck, MessageCircle } from 'lucide-react';
import type { Message } from '@/features/chat/types';
import { useMessageVisibility } from './hooks';

interface MessageListProps {
    messages: Message[];
    socketId: string | null;
    currentRoom: string | null;
    onMessageVisible: (messageId: string) => void;
}

export function MessageList({
    messages,
    socketId,
    currentRoom,
    onMessageVisible,
}: MessageListProps) {
    const { setMessageRef } = useMessageVisibility({
        messages,
        onMessageVisible,
    });

    return (
        <ScrollArea className="flex-1 bg-slate-50/20 dark:bg-zinc-900/10">
            <div className="px-6 py-8 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <MessageCircle className="w-12 h-12 mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Chưa có tin nhắn nào.
                            <br />
                            Hãy bắt đầu câu chuyện!
                        </p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.user === socketId;
                    return (
                        <div
                            key={`${msg.messageId}-${idx}`}
                            className={`flex w-full group animate-in flex-col ${
                                isMe ? 'items-end' : 'items-start'
                            }`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="flex-none pt-1">
                                    <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-zinc-900">
                                        <AvatarFallback
                                            className={isMe ? 'bg-blue-600 text-white' : 'bg-gray-200'}
                                        >
                                            {msg.user[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && !currentRoom && (
                                        <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                                            {msg.user}
                                        </span>
                                    )}
                                    {currentRoom && !isMe && (
                                        <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                                            {msg.user}
                                        </span>
                                    )}
                                    <div
                                        data-message-id={msg.messageId}
                                        ref={(el) => setMessageRef(msg.messageId, el)}
                                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${
                                            isMe
                                                ? 'bg-blue-600 text-white rounded-tr-none hover:bg-blue-700'
                                                : 'bg-white dark:bg-zinc-800 text-foreground rounded-tl-none border dark:border-zinc-700 hover:border-blue-200'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 px-1">
                                        <span className="text-[9px] text-muted-foreground font-medium opacity-60">
                                            {msg.timestamp
                                                ? new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : '12:00 PM'}
                                        </span>
                                        {isMe && (
                                            <div className="flex text-blue-500 opacity-80">
                                                {msg.readBy.length > 1 ? (
                                                    <CheckCheck className="w-3 h-3" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
