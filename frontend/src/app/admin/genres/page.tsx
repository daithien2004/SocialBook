'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Edit, Loader2, Tag, Trash2 } from 'lucide-react';
import { useGenreManagement } from '@/features/admin/hooks/genres/useGenreManagement';
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
            <AdminSearchBar
                title="Quản lý thể loại"
                totalItems={meta?.total || 0}
                totalLabel="thể loại"
                searchPlaceholder="Tìm kiếm tên thể loại..."
                searchValue={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                onAddClick={() => openGenreModal({ onSuccess: refetch })}
                addLabel="Thêm thể loại mới"
            />

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

                        <AdminPagination
                            page={page}
                            totalPages={meta?.totalPages || 0}
                            totalItems={meta?.total || 0}
                            pageSize={15}
                            itemLabel="thể loại"
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
