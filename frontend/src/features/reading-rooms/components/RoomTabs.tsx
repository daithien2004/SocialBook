'use client';
import { Info, Users, BrainCircuit, User, BookOpen, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoomChat } from '@/features/reading-room-interactions/components/RoomChat';
import { ReadingProgress } from '@/features/reading-room-interactions/components/ReadingProgress';
import { QuoteBoard } from '@/features/reading-room-interactions/components/QuoteBoard';
import { KnowledgeSidebar } from '@/features/reading-rooms/components/KnowledgeSidebar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/GlassCard';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import type { PresenceData } from '@/store/useReadingRoomStore';

interface RoomTabsProps {
  variant: 'desktop' | 'mobile';
  sendChatMessage: (content: string) => void;
  isEnded: boolean;
  currentChapterSlug: string;
  roomCode: string;
  isHost: boolean;
  currentUserId?: string;
  bookSlug: string;
  chapterId: string;
  onTransferHost: (user: PresenceData) => void;
}

export function RoomTabs({
  variant,
  sendChatMessage,
  isEnded,
  currentChapterSlug,
  roomCode,
  isHost,
  currentUserId,
  bookSlug,
  chapterId,
  onTransferHost,
}: RoomTabsProps) {
  const router = useRouter();
  const presences = useReadingRoomStore(state => state.presences);

  const isDesktop = variant === 'desktop';

  return (
    <Tabs defaultValue="activity" className={isDesktop ? 'w-full' : 'w-full flex flex-col h-full overflow-hidden'}>
      <TabsList variant="glass" className="grid grid-cols-4 mb-4 shrink-0">
        {[
          { value: 'activity', icon: <Info className="w-3.5 h-3.5" />, label: 'HĐ' },
          { value: 'members', icon: <Users className="w-3.5 h-3.5" />, label: 'TV' },
          { value: 'quotes', icon: <span className="text-sm leading-none">&ldquo;</span>, label: 'TD' },
          { value: 'knowledge', icon: <BrainCircuit className="w-3.5 h-3.5" />, label: 'KT' },
        ].map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-xl flex justify-center lg:justify-start items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary data-[state=active]:text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
          >
            {tab.icon}
            <span className="hidden lg:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="activity"
        className={`mt-0 outline-none${!isDesktop ? ' flex-1 overflow-hidden flex flex-col' : ''}`}
      >
        <RoomChat sendChatMessage={sendChatMessage} disabled={isEnded} />
      </TabsContent>

      <TabsContent
        value="members"
        className={`mt-0 outline-none${!isDesktop ? ' flex-1 overflow-hidden' : ''}`}
      >
        <GlassCard
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight uppercase">Thành viên</h3>
              {!isEnded && (
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {Object.keys(presences).length}
                </Badge>
              )}
            </div>
          }
          className={!isDesktop ? 'h-full flex flex-col' : ''}
        >
          <div className={`p-2 ${isDesktop ? 'max-h-[60vh]' : 'flex-1'} overflow-y-auto custom-scrollbar`}>
            {isEnded ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">Phòng đã kết thúc</div>
            ) : Object.values(presences).length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">Đang đợi mọi người...</div>
            ) : (
              <div className="space-y-1">
                {Object.values(presences).map(p => (
                  <div key={p.userId} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors group relative">
                    <ReadingProgress userId={p.userId} displayName={p.displayName} avatarUrl={p.avatarUrl} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{p.displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate opacity-70">Chương: {p.currentChapterSlug}</p>
                    </div>

                    {isDesktop && (
                      <TooltipProvider>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.userId !== currentUserId && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => router.push(`/reading-rooms/${roomCode}?chapter=${p.currentChapterSlug}`)}>
                                  <BookOpen size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">Đến chương này</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => router.push(`/users/${p.userId}`)}>
                                <User size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-medium">Xem hồ sơ</TooltipContent>
                          </Tooltip>

                          {isHost && p.userId !== currentUserId && !isEnded && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-warning/10 text-warning hover:text-warning/80" onClick={() => onTransferHost(p)}>
                                  <Crown size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium text-warning">Chuyển quyền Host</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </TabsContent>

      <TabsContent value="quotes" className={`mt-0 outline-none${!isDesktop ? ' flex-1 overflow-hidden' : ''}`}>
        <GlassCard header={
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none text-primary">&ldquo;</span>
            <h3 className="text-sm font-bold tracking-tight uppercase">Trích dẫn</h3>
          </div>
        } className={!isDesktop ? 'h-full flex flex-col' : ''}>
          <div className={`p-3 ${isDesktop ? 'max-h-[60vh]' : 'flex-1'} overflow-y-auto custom-scrollbar`}>
            <QuoteBoard currentChapterSlug={currentChapterSlug} roomCode={roomCode} />
          </div>
        </GlassCard>
      </TabsContent>

      <TabsContent value="knowledge" className={`mt-0 outline-none${!isDesktop ? ' flex-1 overflow-hidden' : ''}`}>
        <KnowledgeSidebar bookSlug={bookSlug} chapterId={chapterId} roomId={roomCode} />
      </TabsContent>
    </Tabs>
  );
}
