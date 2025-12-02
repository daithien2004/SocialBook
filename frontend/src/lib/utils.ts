import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    console.warn("Invalid date:", date);
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatNumber(num?: number): string {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export const getErrorMessage = (err: any) => {
  const raw = err?.data?.message ?? err?.message;
  return Array.isArray(raw) ? raw.join('\n') : (raw || 'Update failed');
};

/* Format: "3 phút trước / 2 giờ / Hôm nay" */
export function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";

  return Math.floor(diff / 86400) + " ngày trước";
}