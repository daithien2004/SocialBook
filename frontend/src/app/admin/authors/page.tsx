'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Edit, Trash2, User } from 'lucide-react';
import Image from 'next/image';

import { useAuthorManagement } from '@/features/admin/hooks/authors/useAuthorManagement';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminPagination } from '@/features/admin/components/AdminPagination';

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
            <AdminSearchBar
                title="Quản lý tác giả"
                totalItems={meta?.total || 0}
                totalLabel="tác giả"
                searchPlaceholder="Tìm kiếm theo tên tác giả..."
                searchValue={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                onAddClick={() => openAuthorModal({ onSuccess: refetch })}
                addLabel="Thêm tác giả"
            />

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

                    <AdminPagination
                        page={page}
                        totalPages={meta?.totalPages || 0}
                        totalItems={meta?.total || 0}
                        pageSize={15}
                        itemLabel="tác giả"
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
}
