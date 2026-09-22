'use client';

import { useAppAuth } from '@/features/auth/hooks';
import { timeAgo } from '@/lib/utils';
import { Bell, Check, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotifications } from './useNotifications';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


export function NotificationBell() {
  const { accessToken } = useAppAuth();
  const token = accessToken;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(token);
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
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full px-2 py-0.5 text-[11px] font-bold">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs h-7 px-2 hover:bg-slate-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Đã đọc tất cả
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
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
                    <div className="shrink-0 mt-1.5 w-2 flex items-center justify-center">
                      {isUnread && (
                        <span className="block h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {['system', 'warning', 'error'].includes(notif.type) ? (
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border border-red-200 dark:border-red-800/50">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                      ) : (
                        <Avatar className="h-8 w-8">
                          {notif.meta?.image ? (
                            <AvatarImage src={notif.meta.image} alt={notif.meta.name || 'Avatar'} />
                          ) : null}
                          <AvatarFallback className="bg-slate-100 dark:bg-gray-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {notif.meta?.name ? notif.meta.name.charAt(0).toUpperCase() : "SB"}
                          </AvatarFallback>
                        </Avatar>
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
