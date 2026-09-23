'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Bot, BookOpen, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useAskChatbot } from '@/features/chatbot/api/chatBot.mutations';
import { useChatWidget } from '@/features/chatbot/hooks/useChatWidget';
import { useAppAuth } from '@/features/auth/hooks/useAppAuth';
import { usePathname } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useEffect } from 'react';

export const ChatWidget = () => {
  const pathname = usePathname();
  const askChatbot = useAskChatbot();
  const { isAuthenticated, user } = useAppAuth();

  const isReadingPage = pathname?.includes('/chapters/') || pathname?.includes('/reading-rooms/');

  const {
    messages,
    input,
    isLoading: isSending,
    isOpen,
    messagesEndRef,
    setInput,
    setIsOpen,
    handleSendMessage,
  } = useChatWidget({
    askChatbot: async (params) => {
      return await askChatbot.mutateAsync(params);
    },
    isAuthenticated,
    userId: user?.id,
  });

  useEffect(() => {
    const handleToggle = () => setIsOpen(!isOpen);
    window.addEventListener('toggle-global-chat', handleToggle);
    return () => window.removeEventListener('toggle-global-chat', handleToggle);
  }, [setIsOpen, isOpen]);

  return (
    <div className={`fixed z-50 transition-all duration-300 bottom-6 right-6 ${isReadingPage ? 'max-sm:pointer-events-none' : ''}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={`w-12 h-12 rounded-full shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90 pointer-events-auto opacity-100 scale-100 ${isReadingPage ? 'max-sm:opacity-0 max-sm:scale-0' : ''}`}
          >
            {isOpen ? <X size={20} /> : <Bot size={24} />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] h-[520px] p-0 mr-2 mb-2 rounded-3xl shadow-2xl border border-border/60 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl pointer-events-auto"
          side="top"
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-black/[0.02] dark:bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight">Trợ lý Sách</h4>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-2 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    {msg.role === 'ai' && (
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2.5 text-xs leading-relaxed rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-foreground rounded-tr-sm'
                          : 'bg-black/[0.04] dark:bg-white/5 border border-border/50 text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                      ) : (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                    </div>
                  </div>

                  {/* Book link chips — shown for all AI messages that have sources */}
                  {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (() => {
                    // Deduplicate by bookSlug (if present) or title
                    const seen = new Set<string>();
                    const unique = msg.sources.filter((s) => {
                      const key = s.bookSlug ?? s.title;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    return (
                      <div className="ml-8 flex flex-wrap gap-1.5 mt-0.5">
                        {unique.map((source, idx) => {
                          const href = source.bookSlug
                            ? `/books/${source.bookSlug}`
                            : `/books?search=${encodeURIComponent(source.title)}`;
                          return (
                            <Link
                              key={source.bookSlug ?? `${source.title}-${idx}`}
                              href={href}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/25 hover:border-primary/50 text-[10px] font-semibold text-primary transition-all duration-150 hover:scale-[1.03] active:scale-100"
                            >
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span className="max-w-[140px] truncate">{source.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })()}

                </div>
              ))}

              {isSending && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-black/[0.04] dark:bg-white/5 border border-border/50 px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Footer Input */}
          <form
            className="flex items-center gap-2 p-3 border-t border-border/60 bg-black/[0.02] dark:bg-white/5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="h-9 text-xs rounded-xl bg-background dark:bg-black/40 border-border/50 focus-visible:ring-primary/20"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Gửi tin nhắn"
              disabled={isSending || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-xl"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
};
