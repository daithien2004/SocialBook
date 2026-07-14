'use client';

import { BookForAdmin, BookStatus } from '@/features/books/types/book.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BookOpen, BookText, Edit, Eye, Filter, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

import { useBookManagement } from '@/features/admin/hooks/books/useBookManagement';
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminPagination } from '@/features/admin/components/AdminPagination';

export default function AdminBooksPage() {
  const router = useRouter();
  const {
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    books,
    pagination,
    isLoading,
    isFetching,
    error,
    isDeleting,
    handleDelete,
    openDeleteBook
  } = useBookManagement();

  type StatusFilter = BookStatus | 'all';

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
      <AdminSearchBar
        title="Quản lý sách"
        totalItems={pagination?.total || 0}
        totalLabel="cuốn sách"
        searchPlaceholder="Tìm tên sách hoặc tác giả..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onAddClick={() => router.push('/admin/books/new')}
        addLabel="Thêm sách mới"
      >
        <div className="flex items-center gap-2 w-full sm:w-auto font-medium">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="min-w-[180px] h-10 bg-white rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500/10 text-sm font-medium">
              <div className="flex items-center">
                <Filter className="w-3.5 h-3.5 text-slate-500 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-slate-100 shadow-lg font-medium">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đang phát hành</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminSearchBar>

      {/* Loading (Initial) */}
      {isLoading && (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && !!error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-8 font-medium">
          <p className="text-red-700 font-medium mb-4">Đã có lỗi xảy ra khi tải danh sách sách.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="py-0">
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
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
                    books.map((book: BookForAdmin, index) => (
                      <TableRow key={`${book.id}-${index}`}>
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
                                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold"
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
                        <TableCell className="text-center font-medium">
                          <span className="font-bold text-lg text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                            {book.stats?.chapterCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <div className="flex items-center justify-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit mx-auto">
                            <Eye className="w-4 h-4" />
                            <span className="font-bold">{(book.stats?.views || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 font-medium">
                          {(book.updatedAt || book.createdAt) ? format(new Date(book.updatedAt || book.createdAt), 'dd MMM, yyyy', { locale: vi }) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg">
                              <Link href={`/admin/books/chapters/${book.id}`} title="Quản lý chương">
                                <BookText className="w-4.5 h-4.5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg">
                              <Link href={`/admin/books/${book.slug}`} title="Xem chi tiết">
                                <Eye className="w-4.5 h-4.5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg">
                              <Link href={`/admin/books/edit/${book.id}`} title="Chỉnh sửa">
                                <Edit className="w-4.5 h-4.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteBook({ book, isDeleting, onConfirm: () => handleDelete(book.id) })}
                              className="text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                              title="Xóa sách"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
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
              totalPages={pagination?.totalPages || 0}
              totalItems={pagination?.total || 0}
              pageSize={15}
              itemLabel="sách"
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
