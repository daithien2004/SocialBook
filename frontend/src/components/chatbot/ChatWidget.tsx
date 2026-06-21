'use client';

import { Bot, Send, X } from 'lucide-react';
import { useAskChatbotMutation } from '@/features/chatbot/api/chatBotApi';
import { useChatWidget } from '@/features/chatbot/hooks/useChatWidget';
import { useAppAuth } from '@/features/auth/hooks/useAppAuth';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ChatWidget = () => {
  const [askChatbot] = useAskChatbotMutation();
  const { isAuthenticated } = useAppAuth();

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
      return await askChatbot(params).unwrap();
    },
    isAuthenticated,
  });

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isOpen ? <X size={20} /> : <Bot size={24} />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] h-[520px] p-0 mr-2 mb-2 rounded-3xl shadow-2xl border border-border/60 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl"
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
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Bot className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Xin chào! Tôi là trợ lý sách</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Hỏi tôi bất cứ điều gì về sách,<br />tác giả hoặc nội dung bạn đang đọc!
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
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
                      <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                  </div>
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
