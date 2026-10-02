'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import throttle from 'lodash/throttle';
import { getContentProgress } from '@/features/books/utils/reading-progress';

export function useReadingProgress(chapterSlug?: string) {
  const [readingParagraphId, setReadingParagraphId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  const onActiveParagraphChange = useCallback((id: string) => {
    setReadingParagraphId((prev) => (prev === id ? prev : id));
  }, []);

  const [prevSlug, setPrevSlug] = useState(chapterSlug);
  if (chapterSlug !== prevSlug) {
    setPrevSlug(chapterSlug);
    setReadingParagraphId(null);
    setReadingProgress(0);
  }

  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!contentRef.current) return;
      setReadingProgress(getContentProgress(contentRef.current));
    }, 1500);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    readingProgress,
    readingParagraphId,
    contentRef,
    onActiveParagraphChange,
  };
}
