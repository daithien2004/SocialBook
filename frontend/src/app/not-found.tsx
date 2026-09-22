import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-7xl font-extrabold tracking-tight text-primary">404</h1>
      <h2 className="text-xl font-semibold">Trang không tồn tại</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Địa chỉ trang bạn tìm kiếm có thể đã bị đổi tên, xóa hoặc tạm thời không khả dụng.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
