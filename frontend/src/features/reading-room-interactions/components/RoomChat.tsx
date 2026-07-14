'use client';
import { useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useAppAuth } from '@/features/auth/hooks';
import { GlassCard } from '@/components/common/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

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
      // Use smooth scroll for new messages if already near bottom, else instant
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
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
      className="flex flex-col h-[50vh] overflow-hidden"
      header={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight uppercase">Trò chuyện</h3>
        </div>
      }
    >
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 px-4">
        {userMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pt-10">
            <MessageSquare className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="text-xs font-medium">Chưa có tin nhắn nào</p>
            <p className="text-[10px] mt-1">Hãy là người đầu tiên gửi tin nhắn!</p>
          </div>
        ) : (
          <div className="space-y-1.5 pb-2">
            <AnimatePresence initial={false}>
              {userMessages.map((msg, i) => {
                const isMe = msg.userId === user?.id;
                const prevMsg = userMessages[i - 1];
                const nextMsg = userMessages[i + 1];
                const isSameUserAsPrev = prevMsg?.userId === msg.userId;
                const isSameUserAsNext = nextMsg?.userId === msg.userId;
                
                // Add some top margin if it's a new person talking
                const spacingClass = !isSameUserAsPrev && i > 0 ? 'mt-4' : '';

                return (
                  <motion.div
                    key={`${msg.userId}-${msg.createdAt}-${i}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: isMe ? 'bottom right' : 'bottom left' }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`flex items-end w-full ${isMe ? 'justify-end' : 'justify-start'} ${isMe ? '' : 'gap-2.5'} ${spacingClass}`}
                  >
                    {isMe ? (
                      <div
                        className={`max-w-[75%] min-w-0 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20 p-2.5 px-3.5 overflow-hidden ${isSameUserAsNext ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-br-sm'}`}
                        title={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      >
                        <p className="text-xs leading-relaxed break-words break-all font-medium">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2.5 max-w-[80%]">
                        {isSameUserAsNext ? (
                          <div className="w-7 h-7 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border shadow-sm">
                            {msg.avatarUrl ? (
                              <Image
                                src={msg.avatarUrl || ''}
                                alt=""
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-black text-primary">
                                {(msg.displayName || msg.userId).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          {!isSameUserAsPrev && (
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 mb-1">
                              {msg.displayName || msg.userId.slice(0, 6)}
                            </span>
                          )}
                          <div
                            className={`bg-muted/50 dark:bg-white/5 border border-border/50 shadow-sm p-2.5 px-3.5 overflow-hidden backdrop-blur-sm ${isSameUserAsNext ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-bl-sm'}`}
                            title={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          >
                            <p className="text-xs text-foreground leading-relaxed break-words break-all">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 bg-black/[0.02] dark:bg-white/5 backdrop-blur-md border-t border-border/40 relative z-10">
        <div className="flex items-center gap-2 relative">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? 'Phòng đã kết thúc' : 'Nhập tin nhắn...'}
            disabled={disabled}
            className="h-10 text-xs rounded-full bg-background dark:bg-black/60 border-border shadow-inner focus-visible:ring-primary/30 pl-4 pr-12 transition-all duration-300"
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full absolute right-1 hover:scale-105 transition-transform"
            disabled={disabled || !text.trim()}
          >
            <Send size={12} className="ml-0.5" />
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
