'use client';

import { useEffect } from 'react';

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UserError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-bold">Không thể tải nội dung</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Đã có lỗi xảy ra khi tải trang này.'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Tải lại trang
      </button>
    </div>
  );
}
