'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useLazySearchUsersQuery } from '@/features/users/api/usersApi';
import { useRouter } from "next/navigation";

interface User {
    id: string;
    username: string;
    avatar?: string;
}

export default function UserSearchSidebar() {
    const [keyword, setKeyword] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const route = useRouter();
    const [triggerSearch, {data, isFetching}] = useLazySearchUsersQuery();
    useEffect(() => {
        if (!keyword.trim()) {
            setUsers([]);
            return;
        }

        const timeout = setTimeout(() => {
            triggerSearch({
                keyword,
                current: 1,
                pageSize: 5,
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [keyword, triggerSearch]);

    useEffect(() => {
        if (!data?.data) return;

        const mappedUsers: User[] = data.data.map((u) => ({
            id: u.id,
            username: u.username,
            avatar: u.image,
        }));

        setUsers(mappedUsers);
    }, [data]);

    return (
        <div
            className="bg-white dark:dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-4 space-y-2">
            {/* HEADER */}
            <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                Tìm người dùng
            </h2>

            {/* SEARCH INPUT */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"
                />
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo tên người dùng..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>

            {/* RESULT LIST */}
            <div className="space-y-2">
                {!isFetching && users.length === 0 && keyword && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 text-center py-3">
                        Không tìm thấy người dùng
                    </p>
                )}

                {users
                    .filter((user) => Boolean(user?.id))
                    .map((user) => (
                        <button
                            onClick={() => route.push(`/users/${user.id}`)}
                            key={user.id}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition text-left"
                        >
                            <img
                                src={user.avatar || '/abstract-book-pattern.png'}
                                alt={user.username}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">
                                    {user.username}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                    Xem hồ sơ
                                </p>
                            </div>
                        </button>
                    ))}
            </div>
        </div>
    );
}
