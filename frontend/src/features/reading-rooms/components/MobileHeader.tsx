'use client';
import { ChevronLeft, Check, Copy, Lock, LockOpen, MoreVertical, LogOut, Trash2, DoorOpen, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModalStore } from '@/store/useModalStore';
import { queryClient } from '@/lib/query-client';
import { readingRoomsKeys } from '@/lib/query-keys';
import { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import { PresenceData } from '@/store/useReadingRoomStore';

interface MobileHeaderProps {
  roomCode: string;
  room?: RoomResponse;
  bookData: { title: string } | undefined;
  presences: Record<string, PresenceData>;
  isHost: boolean;
  isEnded: boolean;
  copied: boolean;
  handleCopyCode: () => void;
  changeMode: (mode: 'sync' | 'free') => void;
  endRoom: () => void;
  deleteRoom: () => void;
  isReactivating: boolean;
  onReactivateRoom: () => Promise<void>;
  setTransferHostOpen: (open: boolean) => void;
}

export function MobileHeader({
  roomCode,
  room,
  bookData,
  presences,
  isHost,
  isEnded,
  copied,
  handleCopyCode,
  changeMode,
  endRoom,
  deleteRoom,
  isReactivating,
  onReactivateRoom,
  setTransferHostOpen,
}: MobileHeaderProps) {
  const router = useRouter();
  const { openConfirm } = useModalStore();

  return (
    <header className="sticky top-16 z-50 w-full border-b border-border bg-background transition-all sm:hidden">
      <div className="container mx-auto px-2 min-[400px]:px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-[400px]:gap-2 min-w-0 flex-1 pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/reading-rooms')}
            className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground shrink-0"
            title="Quay lại danh sách phòng"
            aria-label="Quay lại danh sách phòng"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight truncate">Phòng: {roomCode}</h1>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary shrink-0"
                title="Sao chép mã phòng"
                aria-label="Sao chép mã phòng"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
              <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 py-0 bg-primary/5 text-primary border-primary/20 shrink-0 hidden min-[350px]:inline-flex">
                {room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
              </Badge>
              {isEnded && (
                <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 py-0 bg-muted text-muted-foreground border-muted-foreground/30 shrink-0">
                  Kết thúc
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate font-medium">
              {bookData?.title || 'Đang tải sách...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isEnded && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2 mr-1 hidden min-[400px]:flex">
                      {Object.values(presences).slice(0, 3).map(p =>
                        p.avatarUrl ? (
                          <Image
                            key={p.userId}
                            src={p.avatarUrl}
                            alt="Avatar"
                            loading="lazy"
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full border-2 border-background"
                            unoptimized
                          />
                        ) : (
                          <div
                            key={p.userId}
                            className="w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold"
                          >
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-background/50 border border-border px-2 py-1 min-[400px]:px-3 min-[400px]:py-1.5 rounded-full text-[10px] min-[400px]:text-[11px] font-bold shadow-sm">
                      <div className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 rounded-full bg-success animate-pulse shrink-0" />
                      <span>{Object.keys(presences).length}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl font-bold text-[10px]">Thành viên đang hiện diện</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex items-center gap-1 min-[400px]:gap-2">
            {isHost && !isEnded && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full shrink-0">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[60]">
                  <DropdownMenuLabel className="text-xs">Quản lý phòng</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const newMode = room?.mode === 'sync' ? 'free' : 'sync';
                    changeMode(newMode);
                  }}>
                    {room?.mode === 'sync' ? (
                      <><Lock className="w-4 h-4 mr-2 text-primary" /> <span className="text-xs font-medium">Chế độ đồng bộ</span></>
                    ) : (
                      <><LockOpen className="w-4 h-4 mr-2 text-muted-foreground" /> <span className="text-xs font-medium">Chế độ tự do</span></>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTransferHostOpen(true)}>
                    <DoorOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-xs font-medium">Chuyển quyền</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openConfirm({
                    title: "Kết thúc phòng đọc?",
                    description: "Hành động này sẽ đóng phòng đọc đối với tất cả mọi người. Bạn không thể hoàn tác thao tác này.",
                    confirmText: "Xác nhận kết thúc",
                    variant: "destructive",
                    onConfirm: () => {
                      endRoom();
                      setTimeout(() => {
                        void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
                        void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myHistory() });
                        router.refresh();
                      }, 300);
                    }
                  })}>
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Kết thúc phòng</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openConfirm({
                    title: "Xoá phòng đọc?",
                    description: "Hành động này sẽ xoá vĩnh viễn phòng đọc và tất cả dữ liệu liên quan. Không thể hoàn tác!",
                    confirmText: "Xác nhận xoá",
                    variant: "destructive",
                    onConfirm: () => {
                      deleteRoom();
                      void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
                      router.push('/reading-rooms');
                    }
                  })}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Xoá phòng</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isEnded && isHost && (
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7 min-[400px]:w-8 min-[400px]:h-8 rounded-full border-border/60 text-foreground hover:bg-accent/60 shrink-0"
                disabled={isReactivating}
                onClick={onReactivateRoom}
              >
                {isReactivating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LockOpen size={13} />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
