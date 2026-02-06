'use client';

import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAskChatbotMutation } from '../features/chatbot/api/chatBotApi';

import { Avatar } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { ScrollArea } from "@/src/components/ui/scroll-area";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Xin chào! Tôi là trợ lý ảo AI. Bạn cần tìm sách gì hôm nay?',
    },
  ]);

  const [askChatbot, { isLoading }] = useAskChatbotMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatAIResponse = (text: string) => {
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
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await askChatbot({ question: userText }).unwrap();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: formatAIResponse(data.answer),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

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
                <h4 className="font-semibold text-sm">Trợ lý Sách</h4>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Online</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
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

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-sm">
                    <Loader2 className="animate-spin text-slate-400" size={16} />
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
                placeholder="Nhập câu hỏi..."
                className="flex-1 bg-slate-50 dark:bg-gray-800/50 border-0 focus-visible:ring-1 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
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
