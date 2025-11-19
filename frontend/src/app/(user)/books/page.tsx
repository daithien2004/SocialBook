'use client';

import { books } from '@/src/lib/books';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';

export default function BooksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Lấy danh sách genre từ query (có thể nhiều: ?genre=Fantasy,Romance)
  const selectedGenres =
    searchParams.get('genre')?.split(',')?.filter(Boolean) || [];
  const sortBy = searchParams.get('sort') || 'newest';

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
    });

    router.push(`${pathname}?${query}`);
  };

  // Lọc + Sắp xếp
  const filteredAndSortedBooks = useMemo(() => {
    let filtered =
      selectedGenres.length > 0
        ? books.filter((book) => selectedGenres.includes(book.genre))
        : books;

    switch (sortBy) {
      case 'newest':
        return [...filtered].sort((a, b) =>
          (b.publishedYear || '0').localeCompare(a.publishedYear || '0')
        );
      case 'oldest':
        return [...filtered].sort((a, b) =>
          (a.publishedYear || '0').localeCompare(b.publishedYear || '0')
        );
      case 'most-read':
        return [...filtered].sort(
          (a, b) => parseFloat(b.reads) - parseFloat(a.reads)
        );
      case 'highest-rating':
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case 'trending':
        return [...filtered].sort(
          (a, b) => Number(b.isTrending) - Number(a.isTrending)
        );
      default:
        return filtered;
    }
  }, [selectedGenres, sortBy]);

  const allGenres = Array.from(new Set(books.map((b) => b.genre)));

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Danh sách truyện</h1>

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
          <option value="trending">Đang hot</option>
        </select>
      </div>

      {/* Danh sách sách */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredAndSortedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.slug}`}
            className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            <div className="relative aspect-[3/4]">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {book.isNew && (
                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Mới
                </span>
              )}
              {book.isTrending && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Hot
                </span>
              )}
            </div>
            <div className="p-3 space-y-1">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-600">
                {book.title}
              </h3>
              <p className="text-xs text-gray-600">{book.author}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-yellow-600">Rating: {book.rating}</span>
                <span>• {book.reads}</span>
              </div>
              <p className="text-xs text-gray-500">
                {book.chapters} chương • {book.status}
              </p>
            </div>
          </Link>
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
