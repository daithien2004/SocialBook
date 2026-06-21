import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Bot, BookOpen, Users, MapPin, Lightbulb, ChevronDown, ChevronRight, Info, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { ChatMessage } from '@/store/useReadingRoomStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetChapterKnowledgeQuery, useAskChapterAIMutation, useLazyGetChapterKnowledgeQuery } from '@/features/chapters/api/chaptersApi';
import { useState, useEffect, useRef } from 'react';

import { KnowledgeEntity } from '@/features/chapters/types/chapter.interface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';


interface KnowledgeSidebarProps {
  bookSlug: string;
  chapterId: string;
  roomId?: string;
}

export const KnowledgeSidebar = ({ bookSlug, chapterId, roomId }: KnowledgeSidebarProps) => {
  const { data, isLoading: isQueryLoading, error, refetch } = useGetChapterKnowledgeQuery(
    { bookSlug, chapterId },
    { skip: !chapterId }
  );

  const [triggerForceGet, { isLoading: isForceLoading }] = useLazyGetChapterKnowledgeQuery();

  const isLoading = isQueryLoading || isForceLoading;

  const handleRefresh = async () => {
    try {
      await triggerForceGet({ bookSlug, chapterId, force: true }).unwrap();
      refetch();
    } catch (e) {
      toast.error('Không thể tải lại kiến thức. Vui lòng thử lại sau.');
    }
  };


  const [activeTab, setActiveTab] = useState('knowledge');
  const [question, setQuestion] = useState('');
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [askChapterAI, { isLoading: isSoloPending }] = useAskChapterAIMutation();

  const chatMessages = localChatMessages;
  const storageKey = roomId ? `chat_room_${roomId}_${chapterId}` : `chat_solo_${chapterId}`;

  useEffect(() => {
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        const timer = setTimeout(() => setLocalChatMessages(JSON.parse(savedMessages)), 0);
        return () => clearTimeout(timer);
      } catch {
        toast.error('Không thể đọc tin nhắn đã lưu');
      }
    }
  }, [roomId, chapterId, storageKey]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, roomId, chapterId, storageKey]);

  useEffect(() => {
    if (scrollContainerRef.current && scrollRef.current) {
      const viewport = scrollContainerRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      );
      if (viewport instanceof HTMLElement) {
        const refBottom = scrollRef.current.getBoundingClientRect().bottom;
        const viewportBottom = viewport.getBoundingClientRect().bottom;
        if (refBottom > viewportBottom) {
          viewport.scrollBy({
            top: refBottom - viewportBottom,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [chatMessages, isSoloPending]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion('');

    const userMsg: ChatMessage = {
      userId: roomId ? 'ai-question' : 'me',
      role: 'user',
      content: q,
      createdAt: new Date().toISOString(),
    };

    setLocalChatMessages(prev => [...prev, userMsg]);

    try {
      const response = await askChapterAI({ bookSlug, chapterId, question: q }).unwrap();
      const aiMsg: ChatMessage = {
        userId: roomId ? 'gemini-ai' : 'ai',
        role: 'ai',
        content: response.answer,
        createdAt: response.createdAt,
      };

      setLocalChatMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('AI không thể trả lời lúc này. Vui lòng thử lại!');
    }
  };


  const entities = data?.entities || [];

  const characters = entities.filter((e: KnowledgeEntity) => e.type === 'character');
  const locations = entities.filter((e: KnowledgeEntity) => e.type === 'location');
  const concepts = entities.filter((e: KnowledgeEntity) => ['concept', 'event', 'vocabulary', 'reference'].includes(e.type));
  const summary = data?.summary;

  return (
    <GlassCard className="flex flex-col h-[75vh]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-3 pt-3 flex items-center justify-between">
          <TabsList className="flex-1 grid grid-cols-2 gap-2 rounded-2xl h-10 bg-muted/30 p-1">
            <TabsTrigger 
              value="knowledge" 
              className="text-[10px] font-black uppercase tracking-wider bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-colors rounded-xl h-full"
            >
              <BookOpen className="w-3 h-3 mr-1.5" />
              Kiến thức
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="text-[10px] font-black uppercase tracking-wider bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-colors rounded-xl h-full"
            >
              <MessageSquare className="w-3 h-3 mr-1.5" />
              Thảo luận
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="ml-2 h-10 w-10 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>


        <TabsContent value="knowledge" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-muted/50 rounded-2xl"></div>
                  <div className="h-32 bg-muted/50 rounded-2xl"></div>
                  <div className="h-32 bg-muted/50 rounded-2xl"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <Info className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Không thể tải kiến thức chương này. Thử lại sau nhé!</p>
                </div>
              ) : !data ? (
                <div className="p-8 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary opacity-40" />
                  <p className="text-[10px] text-muted-foreground italic">AI đang đọc và phân tích chương sách...</p>
                </div>
              ) : (
                <>
                  {summary && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase text-primary mb-2">Tóm tắt chương</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        &ldquo;{summary}&rdquo;
                      </p>
                    </div>
                  )}

                  <Accordion type="multiple" defaultValue={['characters']} className="space-y-4 pb-4">
                    {characters.length > 0 && (
                      <AccordionItem value="characters" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 mb-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                            <Users className="w-3 h-3" />
                            Nhân vật ({characters.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          {characters.map((c: KnowledgeEntity) => (
                            <EntityCard key={c.name} entity={c} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {locations.length > 0 && (
                      <AccordionItem value="locations" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 mb-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            Địa danh ({locations.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          {locations.map((l: KnowledgeEntity) => (
                            <EntityCard key={l.name} entity={l} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {concepts.length > 0 && (
                      <AccordionItem value="concepts" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 mb-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                            <Lightbulb className="w-3 h-3" />
                            Kiến thức & Chú thích ({concepts.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          {concepts.map((c: KnowledgeEntity) => (
                            <EntityCard key={c.name} entity={c} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
          <ScrollArea ref={scrollContainerRef} className="flex-1 px-3 py-3">
            <div className="space-y-2">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Bot className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Trợ lý AI đang chờ bạn</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Hỏi AI về nội dung chương này<br />hoặc ý nghĩa các đoạn trích nhé!
                    </p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={`${msg.userId || msg.role || 'msg'}-${msg.createdAt || i}-${i}`}
                  className={`flex items-end gap-2 ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'ai'
                        ? 'bg-black/[0.04] dark:bg-white/5 border border-border/50 text-foreground rounded-tl-sm'
                        : 'bg-primary/10 text-foreground rounded-tr-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isSoloPending && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-black/[0.04] dark:bg-white/5 border border-border/50 px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleAskAI} className="p-3 border-t border-border/60 dark:border-border bg-black/[0.02] dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Hỏi AI về nội dung..."
                className="h-9 text-xs rounded-xl bg-background dark:bg-black/40 border-border/50 focus-visible:ring-primary/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!question.trim()}
                className="h-9 w-9 shrink-0 rounded-xl"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
};


const EntityCard = ({ entity }: { entity: KnowledgeEntity }) => {
  const [isExpanded, setIsExpanded] = useState(true);


  return (
    <div
      className="p-3 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold group-hover:text-primary transition-colors">{entity.name}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[8px] h-4 px-1 opacity-60">
            {entity.importance}/10
          </Badge>
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
      </div>
      {isExpanded && (
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {entity.description}
        </p>
      )}
    </div>
  );
};
