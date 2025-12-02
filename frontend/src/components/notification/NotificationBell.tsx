// src/components/notifications/NotificationBell.tsx
"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNotifications } from "./useNotifications";
import type { Session } from "next-auth";

export function NotificationBell({ session }: { session: Session | null }) {
    const token = session?.accessToken as string | undefined;
    const [open, setOpen] = useState(false);
    console.log(token)
    const {
        notifications,
        unreadCount,
        markAsRead,
        refetch,
    } = useNotifications(token);

    // fetch khi component mount
    useEffect(() => {
        refetch();
    }, [refetch]);


    return (
        <div className="relative">
            {/* Icon chuông */}
            <button
                className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                onClick={() => setOpen((prev) => !prev)}
            >
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Thông báo
                        </h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 && (
                            <p className="p-4 text-gray-500 text-sm text-center">
                                {" Không có thông báo nào."}
                            </p>
                        )}

                        {notifications.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={`flex flex-col px-4 py-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                                    !notif.isRead
                                        ? "bg-gray-50 dark:bg-gray-900"
                                        : "bg-transparent"
                                }`}
                            >
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {notif.message}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
