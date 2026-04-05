'use client';

import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useAskChatbotMutation } from '@/features/chatbot/api/chatBotApi';
import { useChatWidget } from './hooks/useChatWidget';

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ChatWidget = () => {
  const [askChatbot, { isLoading }] = useAskChatbotMutation();

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
  });

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
          >
            {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] h-[520px] p-0 mr-6 mb-2 rounded-2xl shadow-2xl border-slate-200 dark:border-gray-800 overflow-hidden flex flex-col"
          side="top"
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-black dark:bg-white items-center justify-center">
                <Bot className="h-5 w-5 text-white dark:text-black" />
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">Tro lý Sach</h4>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Online</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)} aria-label="ong chat">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-white dark:bg-[#0c0c0c]">
            <div className="space-y-4 pr-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] p-3 text-sm leading-relaxed rounded-2xl ${msg.role === 'user'
                        ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-sm'
                        : 'bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 rounded-bl-sm'
                      }`}
                  >
                    {msg.role === 'ai' ? (
                      <div
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-sm">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-[#09090b] border-t border-slate-100 dark:border-gray-800">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhap cau hoi..."
                className="flex-1 bg-slate-50 dark:bg-gray-800/50 border-0 focus-visible:ring-1 focus-visible:ring-offset-0"
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Gui tin nhan"
                disabled={isSending || !input.trim()}
                className={!input.trim() ? "opacity-50" : ""}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
