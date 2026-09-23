'use client';
import { ChevronLeft, Check, Copy, Lock, LockOpen, LogOut, Trash2, DoorOpen, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useModalStore } from '@/store/useModalStore';
import { queryClient } from '@/lib/query-client';
import { readingRoomsKeys } from '@/lib/query-keys';
import { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import { PresenceData } from '@/store/useReadingRoomStore';

interface DesktopSidebarProps {
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
  onTransferHost: () => void;
}

export function DesktopSidebar({
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
  onTransferHost,
}: DesktopSidebarProps) {
  const router = useRouter();
  const { openConfirm } = useModalStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-16 bottom-0 w-16 border-r border-border bg-background flex-col items-center py-4 z-40 hidden sm:flex justify-between">
        <div className="flex flex-col gap-4 items-center w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => router.push('/reading-rooms')} className="w-10 h-10 rounded-full hover:bg-muted text-muted-foreground">
                <ChevronLeft size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Quay lại danh sách</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCopyCode} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors group">
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} className="group-hover:text-primary" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border shadow-md py-2 px-3">
              <p className="font-bold text-foreground">Phòng: {roomCode}</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{bookData?.title}</p>
            </TooltipContent>
          </Tooltip>

          {isHost && !isEnded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => changeMode(room?.mode === 'sync' ? 'free' : 'sync')}>
                  {room?.mode === 'sync' ? <Lock className="w-4 h-4 text-primary" /> : <LockOpen className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Chế độ: {room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}</TooltipContent>
            </Tooltip>
          )}

          {!isHost && !isEnded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground bg-muted/50 cursor-default">
                  {room?.mode === 'sync' ? <Lock className="w-4 h-4 text-primary" /> : <LockOpen className="w-4 h-4 text-muted-foreground" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold">{room?.mode === 'sync' ? 'Chế độ Đồng bộ' : 'Chế độ Tự do'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {room?.mode === 'sync' ? 'Chương đọc theo trưởng phòng' : 'Mỗi người đọc chương riêng'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex flex-col gap-6 items-center w-full">
          {!isEnded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col -space-y-2 mt-2 items-center cursor-pointer">
                  {Object.values(presences).slice(0, 4).map(p =>
                    p.avatarUrl ? (
                      <Image key={p.userId} src={p.avatarUrl} alt="Avatar" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-background z-10 hover:z-20 relative" />
                    ) : (
                      <div key={p.userId} className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold z-10 hover:z-20 relative">
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                  {Object.keys(presences).length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-background bg-muted text-[9px] font-bold flex items-center justify-center z-10 relative">
                      +{Object.keys(presences).length - 4}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{Object.keys(presences).length} thành viên đang online</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex flex-col gap-4 items-center w-full">
          {isHost && !isEnded && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => openConfirm({
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
                    <LogOut size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Kết thúc phòng</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => openConfirm({
                    title: "Xoá phòng đọc?",
                    description: "Hành động này sẽ xoá vĩnh viễn phòng đọc. Không thể hoàn tác!",
                    confirmText: "Xác nhận xoá",
                    variant: "destructive",
                    onConfirm: () => {
                      deleteRoom();
                      void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
                      router.push('/reading-rooms');
                    }
                  })}>
                    <Trash2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Xoá phòng</TooltipContent>
              </Tooltip>
            </>
          )}

          {!isEnded && isHost ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={onTransferHost}>
                  <DoorOpen size={18} className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Chuyển quyền</TooltipContent>
            </Tooltip>
          ) : isEnded && isHost ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" disabled={isReactivating} onClick={onReactivateRoom}>
                  {isReactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Mở lại phòng</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </aside>
    </TooltipProvider>
  );
}
