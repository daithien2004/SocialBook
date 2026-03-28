'use client';

import { ConfirmDelete } from '@/components/admin/ConfirmDelete';
import { useBanUserMutation, useGetUsersQuery } from '@/features/users/api/usersApi';
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

const UsersPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading, isFetching, refetch } = useGetUsersQuery(
        `current=${page}&pageSize=${pageSize}`
    );
    const [banUser, { isLoading: isBanning }] = useBanUserMutation();
    const users = data?.data || [];
    const total = data?.meta?.total || 0;
    const totalPages = data?.meta?.totalPages || Math.ceil(total / pageSize);

    const handleBan = async (id: string) => {
        try {
            await banUser(id).unwrap();
            toast.success('Cập nhật trạng thái người dùng thành công');
            refetch();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Provider
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-16 text-center text-lg text-gray-500"
                                            >
                                                Không tìm thấy người dùng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {user.username}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Mail className="h-4 w-4" />
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                            user.provider ===
                                                            'google'
                                                                ? 'bg-red-100 text-red-800'
                                                                : user.provider ===
                                                                    'facebook'
                                                                  ? 'bg-blue-100 text-blue-800'
                                                                  : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {user.provider}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            {user.isBanned ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                                    <XCircle className="h-3 w-3" />
                                                                    Banned
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {user.isVerified ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                                    <Shield className="h-3 w-3" />
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                                                    <Shield className="h-3 w-3" />
                                                                    Unverified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <ConfirmDelete
                                                            title={
                                                                user.isBanned
                                                                    ? 'Mở khóa người dùng'
                                                                    : 'Khóa người dùng'
                                                            }
                                                            description={
                                                                user.isBanned
                                                                    ? 'Bạn có chắc chắn muốn mở khóa người dùng này?'
                                                                    : 'Bạn có chắc chắn muốn khóa người dùng này?'
                                                            }
                                                            onConfirm={() =>
                                                                handleBan(
                                                                    user.id
                                                                )
                                                            }
                                                            okText={
                                                                user.isBanned
                                                                    ? 'Mở khóa'
                                                                    : 'Khóa'
                                                            }
                                                            okButtonProps={{
                                                                danger: !user.isBanned,
                                                            }}
                                                        >
                                                            <button
                                                                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition-all ${
                                                                    user.isBanned
                                                                        ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500'
                                                                        : 'border-dashed border-red-200 bg-white text-red-500 hover:border-red-400 hover:text-red-600'
                                                                }`}
                                                                title={
                                                                    user.isBanned
                                                                        ? 'Unban User'
                                                                        : 'Ban User'
                                                                }
                                                                disabled={
                                                                    isBanning
                                                                }
                                                            >
                                                                {user.isBanned
                                                                    ? 'Unban'
                                                                    : 'Ban'}
                                                            </button>
                                                        </ConfirmDelete>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * pageSize + 1} -{' '}
                                    {Math.min(page * pageSize, total)} trong{' '}
                                    {total.toLocaleString()} người dùng
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(1, current - 1)
                                            )
                                        }
                                        disabled={page === 1}
                                        className="rounded-lg p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="font-medium">
                                        Trang {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.min(
                                                    totalPages,
                                                    current + 1
                                                )
                                            )
                                        }
                                        disabled={page === totalPages}
                                        className="rounded-lg p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
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
