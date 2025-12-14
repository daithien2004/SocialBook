'use client';

import { Bell, X, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from './useNotifications';
import type { Session } from 'next-auth';
import Image from 'next/image';
import { timeAgo } from '@/src/lib/utils';
import {useRouter} from "next/navigation";

export function NotificationBell({ session }: { session: Session | null }) {
  const token = session?.accessToken as string | undefined;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, refetch } =
    useNotifications(token);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative notification-container">
      {/* ICON CHUÔNG */}
      <button
        className="relative p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
        onClick={() => setOpen((p) => !p)}
        aria-label="Thông báo"
      >
        <Bell
          className={`w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            open ? 'scale-105' : 'group-hover:scale-105'
          }`}
        />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN với animation */}
      {open && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-[420px] rounded-2xl shadow-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Thông báo
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Không có thông báo nào
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Các thông báo mới sẽ hiển thị ở đây
                  </p>
                </div>
              )}

              {notifications.map((notif, index) => {
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    className={`relative border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-all duration-200 ${
                      isUnread
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : 'bg-white dark:bg-[#1a1a1a]'
                    } hover:bg-gray-50 dark:hover:bg-[#222222] group`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.actionUrl) {
                            router.push(notif.actionUrl);
                          }
                        }}
                        className="w-full text-left flex gap-4 px-5 py-4"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={notif.meta?.image || '/user.png'}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover dark:border-gray-800 shadow-sm"
                        />
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-white dark:border-[#1a1a1a] shadow-sm" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm mb-1 line-clamp-2 ${
                            isUnread
                              ? 'font-semibold text-gray-900 dark:text-gray-100'
                              : 'font-medium text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {notif.title}
                        </p>

                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 font-medium">
                            {timeAgo(notif.createdAt)}
                          </p>
                          {isUnread && (
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              • Mới
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mark as read button */}
                      {isUnread && (
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            aria-label="Đánh dấu đã đọc"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer (optional) */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616]">
                <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1">
                  Xem tất cả thông báo
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
