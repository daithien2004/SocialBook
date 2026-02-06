// src/app/admin/books/page.tsx
'use client';

import { useState } from 'react';
import { useGetAdminBooksQuery, useDeleteBookMutation } from '@/src/features/books/api/bookApi';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Search, Plus, Eye, Heart, BookOpen, Filter, ChevronLeft, ChevronRight, Loader2, Edit, Trash2, BookText } from 'lucide-react';
import { BookForAdmin, BackendPagination } from '@/src/features/books/types/book.interface';
import { toast } from 'sonner';
import { useDebounce } from '@/src/hooks/useDebounce';
import { ConfirmDelete } from '@/src/components/admin/ConfirmDelete';

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
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      published: 'bg-green-100 text-green-700 border-green-300',
      completed: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status]}`;
  };

  const getStatusText = (status: BookStatus) => {
    return status === 'draft' ? 'Bản nháp' : status === 'published' ? 'Đang phát hành' : 'Hoàn thành';
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            Thêm sách mới
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-4 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên sách hoặc tác giả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer shadow-sm min-w-[180px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đang phát hành</option>
                <option value="completed">Hoàn thành</option>
              </select>
              <ChevronLeft className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] pointer-events-none" />
            </div>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bìa sách</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên sách</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tác giả</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thể loại</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Chương</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Xem</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cập nhật</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-gray-500 text-lg">
                        Không tìm thấy sách nào
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-16 h-20 relative rounded-lg overflow-hidden shadow-md">
                            {book.coverUrl ? (
                              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="bg-gray-200 border-2 border-dashed rounded-lg w-full h-full flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">/{book.slug}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">{book.authorId?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {book.genres?.length > 0 ? (
                              book.genres.map((g) => (
                                <span
                                  key={`${book.id}-${g.id || (g as any)._id || g.name}`}
                                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                >
                                  {g.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">Chưa có</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={getStatusBadge(book.status)}>{getStatusText(book.status)}</span>
                        </td>
                        <td className="py-4 text-center font-bold text-lg">{book.stats?.chapters || 0}</td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold">{(book.stats?.views || book.views || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(book.updatedAt || book.createdAt) ? format(new Date(book.updatedAt || book.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <Link href={`/admin/books/chapters/${book.id}`} className="p-2 hover:bg-purple-50 rounded-lg transition-colors" title="Quản lý chương">
                              <BookText className="w-5 h-5 text-purple-600" />
                            </Link>
                            <Link href={`/admin/books/${book.slug}`} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết">
                              <Eye className="w-5 h-5 text-blue-600" />
                            </Link>
                            <Link href={`/admin/books/edit/${book.id}`} className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Chỉnh sửa">
                              <Edit className="w-5 h-5 text-green-600" />
                            </Link>
                            <ConfirmDelete
                              title="Xóa sách"
                              description={`Bạn có chắc chắn muốn xóa sách "${book.title}"?`}
                              onConfirm={() => handleDelete(book.id)}
                            >
                              <button
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa sách"
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
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Hiển thị {(page - 1) * 15 + 1} - {Math.min(page * 15, pagination.total)} trong {pagination.total.toLocaleString()} sách
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-medium">Trang {page} / {pagination.totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50">
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
