'use client';

import { useState } from 'react';
import { useGetAuthorsQuery, useDeleteAuthorMutation } from '@/features/authors/api/authorApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Search, Plus, Loader2, Edit, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Author } from '@/features/authors/types/author.interface';
import Image from 'next/image';
import { toast } from 'sonner';

import { useAuthorManagement } from '@/features/admin/hooks/authors/useAuthorManagement';
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

export default function AdminAuthorsPage() {
    const {
        page,
        setPage,
        search,
        setSearch,
        authors,
        meta,
        isLoading,
        isFetching,
        isDeleting,
        refetch,
        handleDelete,
        openAuthorModal,
        openConfirm
    } = useAuthorManagement();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header & Search Card */}
            <div className="bg-white rounded-lg border border-slate-200 mb-6 overflow-hidden shadow-sm">
                <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Quản lý tác giả</h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Tìm thấy <span className="text-indigo-600 font-bold">{meta?.total?.toLocaleString() || 0}</span> tác giả trong hệ thống
                        </p>
                    </div>
                    <Button
                        onClick={() => openAuthorModal({ onSuccess: refetch })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 rounded-lg font-semibold transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm tác giả
                    </Button>
                </div>

                <div className="bg-slate-50/50 px-6 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm theo tên tác giả..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 h-11 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
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
                                           <Table>
                            <TableHeader className="bg-gray-50 border-b border-gray-200">
                                <TableRow>
                                    <TableHead className="w-[80px]">Ảnh</TableHead>
                                    <TableHead>Tên tác giả</TableHead>
                                    <TableHead>Tiểu sử</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Cập nhật</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {authors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-gray-500 text-lg italic">
                                            Không tìm thấy tác giả nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    authors.map((author) => (
                                        <TableRow key={author.id} className="group hover:bg-gray-50/80 transition-colors">
                                            <TableCell>
                                                <div className="w-12 h-12 relative rounded-full overflow-hidden shadow-sm ring-2 ring-gray-100 group-hover:ring-indigo-100 transition-all">
                                                    {author.photoUrl ? (
                                                        <Image src={author.photoUrl} alt={author.name} fill className="object-cover" sizes="48px" />
                                                    ) : (
                                                        <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                                                            <User className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{author.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-600 max-w-md truncate font-medium">
                                                    {author.bio || <span className="text-gray-400 italic font-normal">Chưa có tiểu sử</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500 font-medium">
                                                {format(new Date(author.createdAt), 'dd MMM, yyyy', { locale: vi })}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-400 font-medium">
                                                {format(new Date(author.updatedAt), 'HH:mm dd/MM', { locale: vi })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openAuthorModal({
                                                            author: {
                                                                id: author.id,
                                                                name: author.name,
                                                                bio: author.bio,
                                                                photoUrl: author.photoUrl
                                                            },
                                                            onSuccess: refetch
                                                        })}
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openConfirm({
                                                            title: "Xóa tác giả",
                                                            description: `Bạn có chắc chắn muốn xóa tác giả "${author.name}"?`,
                                                            variant: "destructive",
                                                            confirmText: "Xóa",
                                                            onConfirm: () => handleDelete(author.id, author.name)
                                                        })}
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Xóa tác giả"
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                        {meta && meta.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                    Hiển thị {(page - 1) * 15 + 1} – {Math.min(page * 15, meta.total)} trong {meta.total.toLocaleString()} tác giả
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="rounded-xl"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <span className="font-medium px-2">Trang {page} / {meta.totalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
                                        className="rounded-xl"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
            )}
        </div>
    );
}
