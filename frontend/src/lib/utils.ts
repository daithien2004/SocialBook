import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCompact = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
};

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (!isRecord(error)) return 'An error occurred. Please try again.';

  const response = isRecord(error.response) ? error.response : undefined;
  const data = response && isRecord(response.data) ? response.data : undefined;

  if (data?.code === 'USER_BANNED') {
    return 'Your account is banned. Contact an administrator.';
  }
  if (data && Array.isArray(data.errors)) {
    const messages = data.errors.flatMap((item: unknown) =>
      isRecord(item) && typeof item.message === 'string' ? [item.message] : [],
    );
    if (messages.length > 0) return messages.join(', ');
  }
  if (data && typeof data.detail === 'string') {
    if (typeof data.status === 'number' && data.status >= 500) {
      return typeof data.traceId === 'string'
        ? 'An error occurred. Reference: ' + data.traceId
        : 'An error occurred. Please try again.';
    }
    return data.detail;
  }
  return typeof error.message === 'string'
    ? error.message
    : 'An error occurred. Please try again.';
};

export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )sb_csrf_token=([^;]+)'));
  return match ? match[2] : null;
};

export const NEW_BOOK_DAYS_THRESHOLD = 14;

export function isNewBook(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_BOOK_DAYS_THRESHOLD;
}

export function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;

  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';

  return Math.floor(diff / 86400) + ' ngày trước';
}

export function buildFormData(
  data: object,
  formData: FormData = new FormData(),
): FormData {
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
    } else if (value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File || item instanceof Blob) {
          formData.append(key, item);
        } else if (typeof item === 'object' && item !== null) {
          formData.append(key, JSON.stringify(item));
        } else if (item !== undefined && item !== null) {
          formData.append(key, String(item));
        }
      });
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}
