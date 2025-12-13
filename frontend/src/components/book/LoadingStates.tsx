export function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function LoadingMoreIndicator() {
  return (
    <div className="flex justify-center py-8">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent" />
        <span>Đang tải thêm sách...</span>
      </div>
    </div>
  );
}

export function EndOfListMessage() {
  return (
    <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
      <p>Đã hiển thị tất cả sách</p>
    </div>
  );
}

export function EmptyBooksState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
      <p className="text-lg">Không tìm thấy sách nào</p>
    </div>
  );
}
