'use client';

import { useDeleteBookMutation, useGetAdminBooksQuery } from '@/features/books/api/bookApi';
import { BackendPagination, BookForAdmin } from '@/features/books/types/book.interface';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BookOpen, BookText, ChevronLeft, ChevronRight, Edit, Eye, Filter, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type BookStatus = 'draft' | 'published' | 'completed';
type StatusFilter = BookStatus | 'all';

export default function AdminBooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data, isLoading, isFetching, refetch } = useGetAdminBooksQuery({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  }, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteBook, { isLoading: isDeleting }] = useDeleteBookMutation();
  const { openDeleteBook } = useModalStore();
  const books: BookForAdmin[] = data?.data || [];
  const pagination: BackendPagination | undefined = data?.meta;

  // Delete handlers
  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id).unwrap();
      toast.success('Xóa sách thành công');
      refetch();
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Xóa sách thất bại');
    }
  };

  const getStatusBadge = (status: BookStatus) => {
    const styles: Record<BookStatus, string> = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      completed: 'bg-sky-50 text-sky-700 border-sky-100',
    };
    return (
      <Badge variant="outline" className={`${styles[status]} font-medium px-2.5 py-0.5 rounded-full border shadow-none`}>
        {status === 'draft' ? 'Bản nháp' : status === 'published' ? 'Đang phát hành' : 'Hoàn thành'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 rounded-lg">
      {/* Header & Filters Card */}
      <div className="bg-white rounded-b-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sách</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tổng cộng <span className="font-semibold text-gray-800">{pagination?.total?.toLocaleString() || 0}</span> cuốn sách
            </p>
          </div>
          <Link
            href="/admin/books/new"
            className="flex items-center gap-2"
          >
            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none shadow-lg shadow-blue-500/20 px-6 py-5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 stroke-[2.5px]" />
              Thêm sách mới
            </Button>
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-5 bg-gradient-to-b from-white to-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              placeholder="Tìm kiếm tên sách hoặc tác giả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-11 pr-4 py-6 bg-white border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="min-w-[200px] h-12 bg-white rounded-xl border-gray-200 focus:ring-4 focus:ring-blue-500/5 shadow-sm font-medium">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 text-gray-500 mr-2" />
                  <SelectValue placeholder="Tất cả trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="all" className="rounded-lg">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft" className="rounded-lg">Bản nháp</SelectItem>
                <SelectItem value="published" className="rounded-lg">Đang phát hành</SelectItem>
                <SelectItem value="completed" className="rounded-lg">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
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
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Bìa sách</TableHead>
                    <TableHead>Tên sách</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Thể loại</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Chương</TableHead>
                    <TableHead className="text-center">Xem</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-gray-500 text-lg">
                        Không tìm thấy sách nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="px-6 py-4">
                          <div className="w-16 h-20 relative rounded-lg overflow-hidden shadow-md">
                            {book.coverUrl ? (
                              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="bg-gray-200 border-2 border-dashed rounded-lg w-full h-full flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">/{book.slug}</div>
                        </TableCell>
                        <TableCell className="font-medium">{book.authorId?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {book.genres?.length > 0 ? (
                              book.genres.map((g) => (
                                <Badge
                                  key={`${book.id}-${g.id || g.name}`}
                                  variant="secondary"
                                  className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                                >
                                  {g.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">Chưa có</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {getStatusBadge(book.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                            {book.stats?.chapterCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit mx-auto">
                            <Eye className="w-4 h-4" />
                            <span className="font-bold">{(book.stats?.views || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 font-medium">
                          {(book.updatedAt || book.createdAt) ? format(new Date(book.updatedAt || book.createdAt), 'dd MMM, yyyy', { locale: vi }) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1.5">
                            <Button variant="ghost" size="icon" asChild className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-xl transition-all">
                              <Link href={`/admin/books/chapters/${book.id}`} title="Quản lý chương">
                                <BookText className="w-5 h-5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all">
                              <Link href={`/admin/books/${book.slug}`} title="Xem chi tiết">
                                <Eye className="w-5 h-5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all">
                              <Link href={`/admin/books/edit/${book.id}`} title="Chỉnh sửa">
                                <Edit className="w-5 h-5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteBook({ book, isDeleting, onConfirm: () => handleDelete(book.id) })}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-all"
                              title="Xóa sách"
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
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Hiển thị {(page - 1) * 15 + 1} - {Math.min(page * 15, pagination.total)} trong {pagination.total.toLocaleString()} sách
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="font-medium px-2">Trang {page} / {pagination.totalPages}</span>
                  <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                    <ChevronRight className="w-5 h-5" />
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
