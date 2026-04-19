'use client';

import { useBanUserMutation, useGetUsersQuery } from '@/features/users/api/usersApi';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Mail,
    Shield,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { useUserManagement } from '@/features/admin/hooks/users/useUserManagement';

const UsersPage = () => {
    const {
        page,
        setPage,
        pageSize,
        users,
        total,
        totalPages,
        isLoading,
        isFetching,
        isBanning,
        handleBan,
        openConfirm
    } = useUserManagement();

    return (
        <div className="min-h-screen rounded-lg bg-gray-50">
            {(isLoading || isFetching) && (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
            )}

            {!(isLoading || isFetching) && (
                <div className="py-6">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <Table>
                            <TableHeader className="border-b border-gray-200 bg-gray-50">
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-16 text-center text-lg text-gray-500 italic">
                                            Không tìm thấy người dùng nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="group hover:bg-gray-50/80 transition-colors">
                                            <TableCell>
                                                <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {user.username}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize font-semibold border shadow-none px-2.5 ${
                                                        user.provider === 'google'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                            : user.provider === 'facebook'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                                : 'bg-slate-50 text-slate-700 border-slate-100'
                                                    }`}
                                                >
                                                    {user.provider}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5 w-fit">
                                                    <Badge
                                                        variant={user.isBanned ? 'destructive' : 'outline'}
                                                        className={`gap-1 shadow-none ${!user.isBanned ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}`}
                                                    >
                                                        {user.isBanned ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                                        {user.isBanned ? 'Banned' : 'Active'}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={`gap-1 shadow-none ${user.isVerified ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                                                    >
                                                        <Shield className="h-3 w-3" />
                                                        {user.isVerified ? 'Verified' : 'Unverified'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant={user.isBanned ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => openConfirm({
                                                            title: user.isBanned ? 'Mở khóa người dùng' : 'Khóa người dùng',
                                                            description: user.isBanned 
                                                                ? `Bạn có chắc chắn muốn mở khóa người dùng "${user.username}"?`
                                                                : `Bạn có chắc chắn muốn khóa người dùng "${user.username}"? Hành động này sẽ tạm dừng quyền truy cập của họ.`,
                                                            confirmText: user.isBanned ? 'Mở khóa' : 'Khóa người dùng',
                                                            variant: user.isBanned ? 'default' : 'destructive',
                                                            onConfirm: () => handleBan(user.id)
                                                        })}
                                                        className={`rounded-xl px-4 font-bold transition-all ${
                                                            user.isBanned
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                                                : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                                        }`}
                                                        disabled={isBanning}
                                                    >
                                                        {user.isBanned ? 'Unban' : 'Ban User'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * pageSize + 1} –{' '}
                                    {Math.min(page * pageSize, total)} trong{' '}
                                    {total.toLocaleString()} người dùng
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage((c) => Math.max(1, c - 1))}
                                        disabled={page === 1}
                                        className="rounded-xl"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <span className="px-2">
                                        Trang {page} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                                        disabled={page === totalPages}
                                        className="rounded-xl"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        </div>
                    </div>
                )}
            </div>
        );
};

export default UsersPage;
