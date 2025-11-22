'use client';

import { useGetBooksQuery } from '@/src/features/books/api/bookApi';
import { BookCard } from '@/src/components/book/BookCard';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo, useCallback, useState } from 'react';
import { Search, X } from 'lucide-react';

export default function BooksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading } = useGetBooksQuery();

  const books = data?.books ?? [];

  console.log(books);

  // State cho search input
  const [searchInput, setSearchInput] = useState('');

  // Lấy danh sách genre từ query (có thể nhiều: ?genre=Fantasy,Romance)
  const selectedGenres =
    searchParams.get('genre')?.split(',')?.filter(Boolean) || [];
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('search') || '';

  // Tạo URL mới khi thay đổi filter/sort
  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  // Toggle genre (thêm/xóa)
  const toggleGenre = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];

    const query = createQueryString({
      genre: newGenres.join(','),
      sort: sortBy,
    });

    router.push(`${pathname}?${query}`);
  };

  // Thay đổi sort
  const handleSortChange = (value: string) => {
    const query = createQueryString({
      genre: selectedGenres.join(','),
      sort: value,
      search: searchQuery,
    });

    router.push(`${pathname}?${query}`);
  };

  // Xử lý search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = createQueryString({
      genre: selectedGenres.join(','),
      sort: sortBy,
      search: searchInput.trim(),
    });

    router.push(`${pathname}?${query}`);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    const query = createQueryString({
      genre: selectedGenres.join(','),
      sort: sortBy,
      search: '',
    });

    router.push(`${pathname}?${query}`);
  };

  // Lọc + Sắp xếp
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books;

    // Lọc theo search query
    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.authorId.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Lọc theo genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((book) =>
        book.genres.some((g) => selectedGenres.includes(g.name))
      );
    }

    switch (sortBy) {
      case 'newest':
        return [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return [...filtered].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'most-read':
        return [...filtered].sort((a, b) => b.views - a.views);
      case 'highest-rating':
        return [...filtered].sort((a, b) => b.averageRating - a.averageRating);
      case 'most-liked':
        return [...filtered].sort((a, b) => b.likes - a.likes);
      default:
        return filtered;
    }
  }, [books, selectedGenres, sortBy, searchQuery]);

  // Lấy tất cả genres từ books
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();

    books.forEach((book) => {
      // Kiểm tra book.genres tồn tại và là array
      if (book.genres && Array.isArray(book.genres)) {
        book.genres.forEach((genre) => {
          // Kiểm tra genre.name khác null/undefined
          if (genre?.name) {
            genreSet.add(genre.name);
          }
        });
      }
    });

    return Array.from(genreSet);
  }, [books]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Danh sách truyện</h1>

      {/* Thanh tìm kiếm */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tên truyện, tác giả, mô tả..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {(searchInput || searchQuery) && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {/* Hiển thị từ khóa đang tìm */}
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            Kết quả tìm kiếm cho:{' '}
            <span className="font-semibold">"{searchQuery}"</span> (
            {filteredAndSortedBooks.length} truyện)
          </div>
        )}
      </form>

      {/* Bộ lọc thể loại (multi-select) */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Thể loại:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              router.push(pathname + `?${createQueryString({ sort: sortBy })}`)
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedGenres.length === 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Tất cả
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedGenres.includes(genre)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {genre}
              {selectedGenres.includes(genre) && (
                <span className="ml-1 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị filter đang chọn */}
      {selectedGenres.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Đang lọc:</span>
          {selectedGenres.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {g}
              <button
                onClick={() => toggleGenre(g)}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={() =>
              router.push(pathname + `?${createQueryString({ sort: sortBy })}`)
            }
            className="text-xs text-blue-600 hover:underline"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Sắp xếp */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="most-read">Đọc nhiều nhất</option>
          <option value="highest-rating">Đánh giá cao</option>
          <option value="most-liked">Yêu thích nhất</option>
        </select>
      </div>

      {/* Danh sách sách */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAndSortedBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Không có kết quả */}
      {filteredAndSortedBooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">Không tìm thấy truyện nào.</p>
          <button
            onClick={() => router.push(pathname)}
            className="text-blue-600 hover:underline text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
