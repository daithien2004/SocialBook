import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Bot, BookOpen, Users, MapPin, Lightbulb, ChevronDown, ChevronRight, Info, Loader2, Network, Maximize2, RefreshCw } from 'lucide-react';

import { KnowledgeGraph } from './KnowledgeGraph';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


import { useReadingRoomStore, ChatMessage } from '@/store/useReadingRoomStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetChapterKnowledgeQuery, useAskChapterAIMutation } from '@/features/chapters/api/chaptersApi';
import { useState, useEffect, useRef } from 'react';

import { KnowledgeEntity } from '@/features/chapters/types/chapter.interface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';


interface KnowledgeSidebarProps {
  bookSlug: string;
  chapterId: string;
  roomId?: string;
  askAI?: (question: string) => void;
}

export const KnowledgeSidebar = ({ bookSlug, chapterId, roomId, askAI }: KnowledgeSidebarProps) => {
  const [shouldForce, setShouldForce] = useState(false);
  const { data, isLoading, error, refetch } = useGetChapterKnowledgeQuery(
    { bookSlug, chapterId, force: shouldForce },
    { skip: !chapterId }
  );

  useEffect(() => {
    if (shouldForce && !isLoading) {
      setShouldForce(false);
    }
  }, [shouldForce, isLoading]);

  const handleRefresh = () => {
    setShouldForce(true);
  };


  const [activeTab, setActiveTab] = useState('knowledge');
  const [question, setQuestion] = useState('');
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);


  // Load local messages from localStorage on mount
  useEffect(() => {
    if (!roomId) {
      const savedMessages = localStorage.getItem(`chat_solo_${chapterId}`);
      if (savedMessages) {
        try {
          setLocalChatMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Failed to parse saved messages', e);
        }
      }
    }
  }, [roomId, chapterId]);

  // Save local messages to localStorage when they change
  useEffect(() => {
    if (!roomId && localChatMessages.length > 0) {
      localStorage.setItem(`chat_solo_${chapterId}`, JSON.stringify(localChatMessages));
    }
  }, [localChatMessages, roomId, chapterId]);

  const [askChapterAI, { isLoading: isSoloPending }] = useAskChapterAIMutation();

  const { chatMessages: roomChatMessages } = useReadingRoomStore();
  const chatMessages = roomId ? roomChatMessages : localChatMessages;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSoloPending]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (roomId && askAI) {
      askAI(question);
      setQuestion('');
    } else {
      const userMsg: ChatMessage = {
        userId: 'me',
        role: 'user',
        content: question,
        createdAt: new Date().toISOString()
      };
      setLocalChatMessages(prev => [...prev, userMsg]);
      setQuestion('');

      try {
        const response = await askChapterAI({
          bookSlug,
          chapterId,
          question
        }).unwrap();

        const aiMsg: ChatMessage = {
          userId: 'ai',
          role: 'ai',
          content: response.answer,
          createdAt: response.createdAt
        };
        setLocalChatMessages(prev => [...prev, aiMsg]);
      } catch (err) {
        console.error('AI error', err);
      }
    }
  };


  const entities = data?.entities || [];

  const characters = entities.filter((e: KnowledgeEntity) => e.type === 'character');
  const locations = entities.filter((e: KnowledgeEntity) => e.type === 'location');
  const concepts = entities.filter((e: KnowledgeEntity) => ['concept', 'event', 'vocabulary', 'reference'].includes(e.type));
  const summary = data?.summary;

  return (
    <div className="flex flex-col h-[75vh] bg-background/40 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-3 pt-3 flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl h-10 bg-muted/50 p-1">
            <TabsTrigger value="knowledge" className="rounded-xl text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BookOpen className="w-3 h-3 mr-1.5" />
              Kiến thức
            </TabsTrigger>
            <TabsTrigger value="graph" className="rounded-xl text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Network className="w-3 h-3 mr-1.5" />
              Sơ đồ
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-xl text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MessageSquare className="w-3 h-3 mr-1.5" />
              Thảo luận
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isLoading || shouldForce}
            className="ml-2 h-10 w-10 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoading || shouldForce) ? 'animate-spin' : ''}`} />
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
                        "{summary}"
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
        <TabsContent value="graph" className="flex-1 overflow-hidden mt-0 p-4 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Network className="w-10 h-10 text-primary opacity-60" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Sơ đồ tri thức AI</h4>
            <p className="text-[10px] text-muted-foreground px-6">
              Khám phá mối liên hệ giữa các nhân vật và sự kiện thông qua sơ đồ mạng lưới.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-2 px-6">
                <Maximize2 className="w-3.5 h-3.5" />
                Mở sơ đồ toàn màn hình
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[1000px] h-[80vh] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
              <DialogHeader className="p-6 absolute top-0 left-0 z-10 bg-gradient-to-b from-background to-transparent w-full">
                <DialogTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Sơ đồ tri thức AI - Chương {chapterId.slice(-4).toUpperCase()}
                </DialogTitle>
              </DialogHeader>
              <div className="w-full h-full pt-20">
                {data && (
                  <KnowledgeGraph 
                    entities={data.entities} 
                    relationships={data.relationships || []} 
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          <p className="text-[9px] text-muted-foreground italic mt-4">
            * Nếu sơ đồ trống, hãy thử nhấn làm mới để AI cập nhật lại dữ liệu.
          </p>
        </TabsContent>


        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Trợ lý AI đang chờ bạn</p>
                    <p className="text-[10px] text-muted-foreground">Hãy hỏi AI về nội dung chương này hoặc ý nghĩa của các đoạn trích nhé!</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'ai' ? 'items-start' : 'items-end'
                    }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'ai'
                        ? 'bg-muted/50 border border-border text-foreground'
                        : 'bg-primary text-primary-foreground'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}


              {isSoloPending && (
                <div className="flex flex-col items-start">
                  <div className="bg-muted/50 text-foreground p-3 rounded-2xl flex gap-1">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-muted/20">
            <form onSubmit={handleAskAI} className="relative">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Hỏi AI về nội dung..."
                className="pr-10 rounded-xl bg-background text-xs h-10 border-border/50 focus-visible:ring-primary/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!question.trim()}
                className="absolute right-1 top-1 w-8 h-8 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
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
