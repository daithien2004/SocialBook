'use client';

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
    Edit,
    Loader2,
    Plus,
    Search,
    Tag,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { useGenreManagement } from '@/features/admin/hooks/genres/useGenreManagement';

export default function AdminGenresPage() {
    const {
        page,
        setPage,
        search,
        setSearch,
        genres,
        meta,
        isLoading,
        isFetching,
        isDeleting,
        refetch,
        handleDelete,
        openGenreModal,
        openConfirm
    } = useGenreManagement();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg border border-slate-200 mb-6 overflow-hidden shadow-sm">
                <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Quản lý thể loại</h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Tìm thấy <span className="text-indigo-600 font-bold">{meta?.total?.toLocaleString() || 0}</span> thể loại trong hệ thống
                        </p>
                    </div>
                    <Button
                        onClick={() => openGenreModal({ onSuccess: refetch })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 rounded-lg font-semibold transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm thể loại mới
                    </Button>
                </div>

                <div className="bg-slate-50/50 px-6 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm tên thể loại..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 h-10 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
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
                            <Table>
                                <TableHeader className="border-b border-gray-200 bg-gray-50">
                                    <TableRow>
                                        <TableHead>Tên thể loại</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead>Cập nhật</TableHead>
                                        <TableHead className="text-center">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {genres.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-16 text-center text-lg text-gray-500">
                                                Không tìm thấy thể loại nào
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        genres.map((genre, index) => (
                                            <TableRow key={`${genre.id}-${index}`} className="group transition-colors hover:bg-gray-50/80">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-violet-100 rounded-lg text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                                            <Tag className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-bold text-gray-900">{genre.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">
                                                        {genre.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-md truncate text-sm text-gray-600 font-medium">
                                                        {genre.description || (
                                                            <span className="italic text-gray-400">Chưa có mô tả</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 font-medium">
                                                    {format(new Date(genre.createdAt), 'dd MMM, yyyy', { locale: vi })}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-400 font-medium">
                                                    {format(new Date(genre.updatedAt), 'HH:mm dd/MM', { locale: vi })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openGenreModal({
                                                                genre: { id: genre.id, name: genre.name, description: genre.description },
                                                                onSuccess: refetch
                                                            })}
                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openConfirm({
                                                                title: "Xóa thể loại",
                                                                description: `Bạn có chắc chắn muốn xóa thể loại "${genre.name}"?`,
                                                                variant: "destructive",
                                                                confirmText: "Xóa",
                                                                onConfirm: () => handleDelete(genre.id, genre.name)
                                                            })}
                                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-all"
                                                            title="Xóa thể loại"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * 15 + 1} –{' '}
                                    {Math.min(page * 15, meta.total)} trong{' '}
                                    {meta.total.toLocaleString()} thể loại
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </Button>
                                    <span className="font-medium px-2">Trang {page} / {meta.totalPages}</span>
                                    <Button variant="outline" size="icon" onClick={() => setPage((c) => Math.min(meta.totalPages, c + 1))} disabled={page === meta.totalPages}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
