'use client';

import { ConfirmDelete } from '@/components/admin/ConfirmDelete';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/utils';
import {
    useDeleteGenreMutation,
    useGetGenresQuery,
} from '@/features/genres/api/genreApi';
import { Genre } from '@/features/genres/types/genre.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    Loader2,
    Plus,
    Search,
    Tag,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminGenresPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, isFetching, refetch } = useGetGenresQuery(
        {
            page,
            pageSize: 15,
            name: debouncedSearch || undefined,
        },
        {
            refetchOnMountOrArgChange: true,
        }
    );

    const [deleteGenre, { isLoading: isDeleting }] = useDeleteGenreMutation();
    const genres: Genre[] = data?.data || [];
    const meta = data?.meta;

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteGenre(id).unwrap();
            toast.success('Xóa thể loại thành công!');
            refetch();
        } catch (error: unknown) {
            console.error('Failed to delete genre:', error);
            toast.error(
                getErrorMessage(error) || `Xóa thể loại "${name}" thất bại!`
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md">
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quản lý thể loại
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tổng cộng{' '}
                            <span className="font-semibold text-gray-800">
                                {meta?.total?.toLocaleString() || 0}
                            </span>{' '}
                            thể loại
                        </p>
                    </div>
                    <Link
                        href="/admin/genres/new"
                        className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
                    >
                        <Plus className="h-5 w-5" />
                        Thêm thể loại mới
                    </Link>
                </div>

                <div className="bg-gray-50/50 px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên thể loại..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
            </div>

            {(isLoading || isFetching) && (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
            )}

            {!(isLoading || isFetching) && (
                <div className="py-0">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Tên thể loại
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Slug
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Mô tả
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Ngày tạo
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Cập nhật
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {genres.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-16 text-center text-lg text-gray-500"
                                            >
                                                Không tìm thấy thể loại nào
                                            </td>
                                        </tr>
                                    ) : (
                                        genres.map((genre) => (
                                            <tr
                                                key={genre.id}
                                                className="transition-colors hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-5 w-5 text-blue-600" />
                                                        <span className="font-semibold text-gray-900">
                                                            {genre.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                                                        {genre.slug}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-md truncate text-sm text-gray-600">
                                                        {genre.description || (
                                                            <span className="italic text-gray-400">
                                                                Chưa có mô tả
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(
                                                        new Date(genre.createdAt),
                                                        'dd/MM/yyyy',
                                                        { locale: vi }
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {format(
                                                        new Date(genre.updatedAt),
                                                        'dd/MM/yyyy HH:mm',
                                                        { locale: vi }
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <Link
                                                            href={`/admin/genres/edit/${genre.id}`}
                                                            className="rounded-lg p-2 transition-colors hover:bg-green-50"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="h-5 w-5 text-green-600" />
                                                        </Link>
                                                        <ConfirmDelete
                                                            title="Xóa thể loại"
                                                            description={`Bạn có chắc chắn muốn xóa thể loại "${genre.name}"?`}
                                                            onConfirm={() =>
                                                                handleDelete(
                                                                    genre.id,
                                                                    genre.name
                                                                )
                                                            }
                                                        >
                                                            <button
                                                                className="rounded-lg p-2 transition-colors hover:bg-red-50"
                                                                title="Xóa thể loại"
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash2 className="h-5 w-5 text-red-600" />
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

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * 15 + 1} -{' '}
                                    {Math.min(page * 15, meta.total)} trong{' '}
                                    {meta.total.toLocaleString()} thể loại
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
                                        Trang {page} / {meta.totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.min(
                                                    meta.totalPages,
                                                    current + 1
                                                )
                                            )
                                        }
                                        disabled={page === meta.totalPages}
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
}
