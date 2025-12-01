'use client';

import { useState } from 'react';
import { useGetAuthorsQuery, useDeleteAuthorMutation } from '@/src/features/authors/api/authorApi';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Search, Plus, Loader2, Edit, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Author } from '@/src/features/authors/types/author.interface';
import Image from 'next/image';
import { toast } from 'sonner';

export default function AdminAuthorsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data, isLoading, isFetching, refetch } = useGetAuthorsQuery({
        page,
        pageSize: 15,
        name: search || undefined,
    }, {
        refetchOnMountOrArgChange: true,
    });

    const [deleteAuthor, { isLoading: isDeleting }] = useDeleteAuthorMutation();
    const authors: Author[] = data?.data || [];
    const meta = data?.meta;

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tác giả "${name}"?`)) return;

        try {
            await deleteAuthor(id).unwrap();
            refetch();
        } catch (error) {
            console.error('Failed to delete author:', error);
            toast.error('Xóa tác giả thất bại!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý tác giả</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tổng cộng <span className="font-semibold">{meta?.total?.toLocaleString() || 0}</span> tác giả
                        </p>
                    </div>
                    <Link
                        href="/admin/authors/new"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm tác giả mới
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên tác giả..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ảnh</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên tác giả</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiểu sử</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cập nhật</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {authors.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-gray-500 text-lg">
                                                Không tìm thấy tác giả nào
                                            </td>
                                        </tr>
                                    ) : (
                                        authors.map((author) => (
                                            <tr key={author.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-12 h-12 relative rounded-full overflow-hidden shadow-md">
                                                        {author.photoUrl ? (
                                                            <Image src={author.photoUrl} alt={author.name} fill className="object-cover" sizes="48px" />
                                                        ) : (
                                                            <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                                                                <User className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{author.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-md truncate">
                                                        {author.bio || <span className="text-gray-400 italic">Chưa có tiểu sử</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(new Date(author.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(new Date(author.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <Link
                                                            href={`/admin/authors/edit/${author.id}`}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-5 h-5 text-green-600" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(author.id, author.name)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa tác giả"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="w-5 h-5 text-red-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * 15 + 1} - {Math.min(page * 15, meta.total)} trong {meta.total.toLocaleString()} tác giả
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-medium">Trang {page} / {meta.totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
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
}
