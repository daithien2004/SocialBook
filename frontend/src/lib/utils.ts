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
  if (!date) return "";

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(num?: number): string {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  const err = error as {
    response?: { data?: { message?: string | string[] } };
    data?: { message?: string | string[] };
    message?: string;
  } | undefined;
  const data = err?.response?.data ?? err?.data;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  return data?.message ?? err?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
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

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";

  return Math.floor(diff / 86400) + " ngày trước";
}

export function buildFormData(
  data: object,
  formData: FormData = new FormData()
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