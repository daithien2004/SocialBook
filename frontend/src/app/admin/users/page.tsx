'use client';

import { useState } from 'react';
import { useGetUsersQuery, useBanUserMutation } from '@/src/features/users/api/usersApi';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Lock, Unlock, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmDelete } from '@/src/components/admin/ConfirmDelete';

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
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 rounded-lg">

            {/* Loading */}
            {(isLoading || isFetching) && (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            )}

            {/* Table */}
            {!(isLoading || isFetching) && (
                <div className="py-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16 text-gray-500 text-lg">
                                                Không tìm thấy người dùng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user: any) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{user.username}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Mail className="w-4 h-4" />
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${user.provider === 'google' ? 'bg-red-100 text-red-800' :
                                                            user.provider === 'facebook' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {user.provider}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            {user.isBanned ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                    <XCircle className="w-3 h-3" /> Banned
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                    <CheckCircle className="w-3 h-3" /> Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {user.isVerified ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                                    <Shield className="w-3 h-3" /> Verified
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                                    <Shield className="w-3 h-3" /> Unverified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <ConfirmDelete
                                                            title={user.isBanned ? 'Mở khóa người dùng' : 'Khóa người dùng'}
                                                            description={user.isBanned ? 'Bạn có chắc chắn muốn mở khóa người dùng này?' : 'Bạn có chắc chắn muốn khóa người dùng này?'}
                                                            onConfirm={() => handleBan(user.id)}
                                                            okText={user.isBanned ? 'Mở khóa' : 'Khóa'}
                                                            okButtonProps={{ danger: !user.isBanned }} // Ban = danger, Unban = not danger
                                                        >
                                                            <button
                                                                className={`px-3 py-1.5 rounded-md transition-all text-sm font-medium border shadow-sm flex items-center gap-2
                                                                    ${user.isBanned
                                                                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500' // Primary style (Unban)
                                                                        : 'bg-white text-red-500 border-red-200 border-dashed hover:text-red-600 hover:border-red-400' // Dashed Danger style (Ban)
                                                                    }`}
                                                                title={user.isBanned ? 'Unban User' : 'Ban User'}
                                                            >
                                                                {user.isBanned ? (
                                                                    <>Unban</>
                                                                ) : (
                                                                    <>Ban</>
                                                                )}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} trong {total.toLocaleString()} người dùng
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-medium">Trang {page} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
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