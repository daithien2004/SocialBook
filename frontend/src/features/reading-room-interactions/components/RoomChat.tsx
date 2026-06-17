'use client';
import { useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { useAppAuth } from '@/features/auth/hooks';
import { GlassCard } from '@/components/common/GlassCard';

interface RoomChatProps {
  sendChatMessage: (content: string) => void;
  disabled?: boolean;
}

export function RoomChat({ sendChatMessage, disabled }: RoomChatProps) {
  const [text, setText] = useState('');
  const chatMessages = useReadingRoomStore((s) => s.chatMessages);
  const { user } = useAppAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setText('');
    inputRef.current?.focus({ preventScroll: true });
  };

  const userMessages = chatMessages.filter((m) => m.role === 'user' && m.userId !== 'ai-question');

  return (
    <GlassCard 
      className="flex flex-col h-[50vh]"
      header={<h3 className="text-sm font-bold tracking-tight uppercase">Trò chuyện</h3>}
    >

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        {userMessages.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Chưa có tin nhắn nào
          </div>
        ) : (
          <div className="space-y-1">
            {userMessages.map((msg, i) => {
              const isMe = msg.userId === user?.id;
              const prevMsg = userMessages[i - 1];
              const nextMsg = userMessages[i + 1];
              const isSameUserAsPrev = prevMsg?.userId === msg.userId;
              const isSameUserAsNext = nextMsg?.userId === msg.userId;
              return (
                <div
                  key={`${msg.userId}-${msg.createdAt}-${i}`}
                  className={`flex items-end max-w-full ${isMe ? 'justify-end' : 'justify-start'} ${isMe ? '' : 'gap-2.5'}`}
                >
                  {isMe ? (
                    <div
                      className="max-w-[65%] min-w-0 bg-primary/10 rounded-2xl p-2.5 overflow-hidden"
                      title={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    >
                      <p className="text-xs text-foreground leading-relaxed break-words break-all">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2.5 max-w-[65%]">
                      {isSameUserAsNext ? (
                        <div className="w-7 h-7 shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {msg.avatarUrl ? (
                            <Image
                              src={msg.avatarUrl || ''}
                              alt=""
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-primary">
                              {(msg.displayName || msg.userId).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        {!isSameUserAsPrev && (
                          <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">
                            {msg.displayName || msg.userId.slice(0, 6)}
                          </span>
                        )}
                        <div
                          className="bg-black/[0.03] dark:bg-white/5 rounded-2xl p-2.5 overflow-hidden"
                          title={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        >
                          <p className="text-xs text-foreground leading-relaxed break-words break-all">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border/60 dark:border-border bg-black/[0.02] dark:bg-white/5">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? 'Phòng đã kết thúc' : 'Nhập tin nhắn...'}
            disabled={disabled}
            className="h-9 text-xs rounded-xl bg-background dark:bg-black/40 border-border/50 focus-visible:ring-primary/20"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            disabled={disabled || !text.trim()}
          >
            <Send size={14} />
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
