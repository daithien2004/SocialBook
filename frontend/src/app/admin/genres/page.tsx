'use client';

import { useState } from 'react';
import { useGetGenresQuery, useDeleteGenreMutation } from '@/src/features/genres/api/genreApi';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Search, Plus, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { Genre } from '@/src/features/genres/types/genre.interface';
import { toast } from 'sonner';
import { useDebounce } from '@/src/hooks/useDebounce';
import { ConfirmDelete } from '@/src/components/admin/ConfirmDelete';

export default function AdminGenresPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, isFetching, refetch } = useGetGenresQuery({
        page,
        pageSize: 15,
        name: debouncedSearch || undefined,
    }, {
        refetchOnMountOrArgChange: true,
    });

    const [deleteGenre, { isLoading: isDeleting }] = useDeleteGenreMutation();
    const genres: Genre[] = data?.data || [];
    const meta = data?.meta;

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteGenre(id).unwrap();
            toast.success('Xóa thể loại thành công!');
            refetch();
        } catch (error: any) {
            console.error('Failed to delete genre:', error);
            const errorMessage = error?.data?.message || 'Xóa thể loại thất bại!';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header & Search Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý thể loại</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tổng cộng <span className="font-semibold text-gray-800">{meta?.total?.toLocaleString() || 0}</span> thể loại
                        </p>
                    </div>
                    <Link
                        href="/admin/genres/new"
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm thể loại mới
                    </Link>
                </div>

                <div className="px-6 py-4 bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên thể loại..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
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
                <div className="py-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên thể loại</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mô tả</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cập nhật</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {genres.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-gray-500 text-lg">
                                                Không tìm thấy thể loại nào
                                            </td>
                                        </tr>
                                    ) : (
                                        genres.map((genre) => (
                                            <tr key={genre.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-5 h-5 text-blue-600" />
                                                        <span className="font-semibold text-gray-900">{genre.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{genre.slug}</code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-md truncate">
                                                        {genre.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(new Date(genre.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(new Date(genre.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <Link
                                                            href={`/admin/genres/edit/${genre.id}`}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-5 h-5 text-green-600" />
                                                        </Link>
                                                        <ConfirmDelete
                                                            title="Xóa thể loại"
                                                            description={`Bạn có chắc chắn muốn xóa thể loại "${genre.name}"?`}
                                                            onConfirm={() => handleDelete(genre.id, genre.name)}
                                                        >
                                                            <button
                                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Xóa thể loại"
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash2 className="w-5 h-5 text-red-600" />
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
                        {meta && meta.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * 15 + 1} - {Math.min(page * 15, meta.total)} trong {meta.total.toLocaleString()} thể loại
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
