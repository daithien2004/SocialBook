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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div
          className={`w-[360px] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-200 ${
            isAnimatingOut
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="font-semibold text-sm">Trợ lý Sách</div>
                <div className="text-[10px] text-blue-100">
                  Luôn sẵn sàng hỗ trợ
                </div>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] p-3.5 text-[13px] leading-[1.6] rounded-2xl transition-all duration-200 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200 rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-md rounded-bl-md'
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
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-md border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2 items-center bg-gray-50 px-3 py-2.5 rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-100/50 transition-all duration-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  input.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-200 hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700'
            : 'bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
        }`}
      >
        {isOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <MessageCircle className="text-white" size={24} />
        )}
      </button>
    </div>
  );
};
