'use client';
import { useState, useRef, useEffect } from 'react';
import throttle from 'lodash/throttle';
import { getContentProgress } from '@/features/books/utils/reading-progress';

export function useReadingProgress() {
  const [readingParagraphId, setReadingParagraphId] = useState<string | null>(
    null,
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);

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
    onActiveParagraphChange: setReadingParagraphId,
  };
}
