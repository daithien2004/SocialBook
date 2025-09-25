import { get } from "http";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const AUTH_ENDPOINTS = {
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  refresh: `${API_BASE_URL}/auth/refresh`,
};


export const BOOKS_ENDPOINTS = {
  bookAndFirstChapter: (bookSlug: string) =>
    `${API_BASE_URL}/books/${bookSlug}/first-chapter`,
  getMetadataNextChapter: (bookSlug: string, currentOrderIndex: number) =>
    `${API_BASE_URL}/books/${bookSlug}/next-chapter?currentOrderIndex=${currentOrderIndex}`,
  chapterContent: (chapterId: string) =>
    `${API_BASE_URL}/books/chapter/by-id/${chapterId}/content`,
};