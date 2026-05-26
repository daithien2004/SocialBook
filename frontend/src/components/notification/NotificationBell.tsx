'use client';

import { useAppAuth } from '@/features/auth/hooks';
import { timeAgo } from '@/lib/utils';
import { Bell, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotifications } from './useNotifications';

import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationBell() {
  const { accessToken } = useAppAuth();
  const token = accessToken;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications(token);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-slate-100 dark:hover:bg-gray-800"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 mr-4 shadow-xl border-border bg-card"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground/90 hover:bg-primary/20">
              {unreadCount} mới
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-foreground">Không có thông báo nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Khi có hoạt động mới, chúng sẽ hiển thị ở đây.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.actionUrl) {
                        router.push(notif.actionUrl);
                        setOpen(false);
                      }
                    }}
                    className="w-full text-left flex items-start gap-3 p-4 transition-colors border-b border-slate-50 dark:border-gray-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-gray-800/20 cursor-pointer"
                  >
                    <div
                      className="relative shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notif.meta?.actorId) {
                          router.push(`/users/${notif.meta.actorId}`);
                          setOpen(false);
                        }
                      }}
                    >
                      <UserAvatar
                        src={notif.meta?.image}
                        name={notif.meta?.username}
                        size="md"
                      />
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white dark:border-[#1a1a1a]" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {isUnread && (
                      <div
                        className="shrink-0 p-1 rounded-full text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
