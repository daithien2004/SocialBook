'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, BookOpen, Loader2 } from 'lucide-react';
import { useAskChatbotMutation } from '../features/chatbot/api/chatBotApi';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimatingOut(false);
      }, 200);
    } else {
      setIsOpen(true);
    }
  };

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
      {isOpen && (
        <div
          className={`w-[360px] h-[520px] bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-200 ease-out origin-bottom-right ${
            isAnimatingOut
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {/* Header - Simple & Clean */}
          <div className="bg-white dark:bg-[#09090b] p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <BookOpen size={16} className="text-white dark:text-black" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Trợ lý Sách</div>
                <div className="text-[11px] text-green-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#0c0c0c] space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-[85%] p-3.5 text-[14px] leading-relaxed rounded-2xl transition-all ${
                    msg.role === 'user'
                      ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-sm'
                      : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/5 rounded-bl-sm shadow-sm'
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
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="bg-white dark:bg-[#1a1a1a] p-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200 dark:border-white/5">
                  <Loader2 className="animate-spin text-gray-400" size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Minimal */}
          <div className="p-3 bg-white dark:bg-[#09090b] border-t border-gray-100 dark:border-white/5">
            <div className="flex gap-2 items-center bg-transparent px-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                  input.trim()
                    ? 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button - Simple Black Circle */}
      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 bg-black dark:bg-white text-white dark:text-black hover:shadow-xl`}
      >
         {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>
    </div>
  );
};
