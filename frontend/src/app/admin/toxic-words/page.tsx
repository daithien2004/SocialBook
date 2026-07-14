'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useToxicWordsManagement } from '@/features/admin/hooks/moderation/useToxicWordsManagement';
import { ToxicWordModal } from '@/components/admin/moderation/ToxicWordModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ToxicWordsPage() {
    const {
        toxicWords,
        meta,
        isLoading,
        page,
        search,
        handlePageChange,
        handleSearch,
        handleAdd,
        handleDelete,
        isAdding,
        isDeleting
    } = useToxicWordsManagement();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="p-6">
            <AdminSearchBar
                title="Quản lý từ khoá thô tục"
                totalItems={meta?.total || 0}
                totalLabel="từ khoá"
                searchPlaceholder="Tìm kiếm từ khoá hoặc pattern..."
                searchValue={search}
                onSearchChange={handleSearch}
                onAddClick={() => setIsAddModalOpen(true)}
                addLabel="Thêm từ khoá"
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow>
                                <TableHead className="w-[180px] font-semibold text-gray-600">Từ khoá gốc</TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-gray-600">Pattern (Regex)</TableHead>
                                <TableHead className="w-[150px] font-semibold text-gray-600">Nhóm</TableHead>
                                <TableHead className="w-[180px] font-semibold text-gray-600">Ngày tạo</TableHead>
                                <TableHead className="text-right w-[100px] font-semibold text-gray-600">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                            ) : toxicWords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                                            <p>Không tìm thấy từ khoá nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                toxicWords.map((word) => (
                                    <TableRow key={word.id}>
                                        <TableCell>
                                            {word.originalWord ? (
                                                <span className="font-medium text-gray-900">{word.originalWord}</span>
                                            ) : (
                                                <span className="italic text-gray-400">Không xác định</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <code className="rounded-md bg-rose-50 text-rose-600 px-2.5 py-1 font-mono text-[13px] font-medium border border-rose-100">
                                                {word.pattern}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={
                                                    word.group === 'thô tục mạnh' || word.group === 'xúc phạm' 
                                                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm" 
                                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm"
                                                }
                                            >
                                                {word.group}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {format(new Date(word.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc muốn xoá từ khoá này?')) {
                                                        handleDelete(word.id);
                                                    }
                                                }}
                                                disabled={isDeleting}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                                title="Xoá"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {meta && meta.totalPages > 1 && (
                    <AdminPagination
                        page={page}
                        totalPages={meta.totalPages}
                        totalItems={meta.total}
                        pageSize={meta.pageSize}
                        itemLabel="từ khoá"
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <ToxicWordModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAdd}
                isSubmitting={isAdding}
            />
        </div>
    );
}
