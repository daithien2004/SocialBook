import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Hash, Info, LogOut, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@radix-ui/react-separator';

interface CurrentUser {
  id: string;
  username: string;
  image?: string;
}

interface ChatHeaderProps {
  currentRoom: string | null;
  recipient: string | null;
  typingUsers: string[];
  onLeaveRoom: () => void;
  currentUser: CurrentUser | null;
}

export function ChatHeader({
  currentRoom,
  recipient,
  typingUsers,
  onLeaveRoom,
  currentUser,
}: ChatHeaderProps) {
  const title = currentRoom || recipient || '';
  const isRoom = !!currentRoom;

  return (
    <div className="flex flex-row items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 border-b dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-10 h-10 border-2 border-blue-50 dark:border-blue-900/20">
            <AvatarFallback className="bg-blue-600 text-white font-bold">
              {title[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {!isRoom && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
          )}
        </div>
        <div>
          <div className="font-bold flex items-center gap-1.5">
            {isRoom && <Hash className="w-4 h-4 text-muted-foreground" />}
            {title}
            {isRoom && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] h-4"
              >
                Phòng Chat
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 h-4">
            {typingUsers.length > 0 ? (
              <span className="text-[11px] text-blue-600 font-medium animate-pulse">
                {typingUsers.join(', ')} đang soạn tin...
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Trực tuyến
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100"
        >
          <Phone className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100"
        >
          <Video className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100"
            >
              <Info className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl p-1 shadow-lg border-zinc-200"
          >
            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium">
              <Info className="w-4 h-4" /> Thông tin cuộc gọi
            </DropdownMenuItem>
            {isRoom && (
              <DropdownMenuItem
                className="rounded-lg gap-2 cursor-pointer font-medium text-red-600"
                onClick={onLeaveRoom}
              >
                <LogOut className="w-4 h-4" /> Rời khỏi phòng
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
