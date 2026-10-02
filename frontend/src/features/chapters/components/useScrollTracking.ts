'use client'

import { useRef, useCallback, useEffect } from 'react'
import { scrollToHighlight } from '@/utils/scroll-to-highlight'

interface Paragraph {
  id: string
  content: string
}

export function useScrollTracking(
  paragraphs: Paragraph[],
  onActiveParagraphChange?: (paragraphId: string) => void,
  resetKey?: string,
) {
  const elById = useRef(new Map<string, HTMLElement>());
  const idByEl = useRef(new WeakMap<Element, string>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeRef = useRef<string | null>(null);
  const cbRef = useRef(onActiveParagraphChange);
  
  useEffect(() => { 
    cbRef.current = onActiveParagraphChange; 
  });

  useEffect(() => {
    activeRef.current = null;
    const obs = new IntersectionObserver(
      (entries) => {
        let best: { id: string; top: number } | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = idByEl.current.get(e.target);
          if (!id) continue;
          const top = e.boundingClientRect.top;
          if (!best || top < best.top) best = { id, top };
        }
        if (best && best.id !== activeRef.current) {
          activeRef.current = best.id;
          if (cbRef.current) cbRef.current(best.id);
        }
      },
      { rootMargin: '-35% 0px -64% 0px', threshold: 0 },
    );
    observerRef.current = obs;
    elById.current.forEach((el) => obs.observe(el));
    return () => { 
      obs.disconnect(); 
      observerRef.current = null; 
    };
  }, [resetKey]);

  const refCallbacks = useRef<Map<string, (el: HTMLElement | null) => void>>(new Map());

  const getParaRef = useCallback((id: string) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        const prev = elById.current.get(id);
        if (prev && prev !== el) {
          observerRef.current?.unobserve(prev);
          idByEl.current.delete(prev);
          elById.current.delete(id);
        }
        if (el) {
          elById.current.set(id, el);
          idByEl.current.set(el, id);
          observerRef.current?.observe(el);
        }
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);

  // Hash scroll on mount (#paragraph-xxx)
  useEffect(() => {
    if (paragraphs.length > 0 && typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.substring(1)
      if (id.startsWith('paragraph-')) {
        setTimeout(() => {
          scrollToHighlight(`#${id}`, 0)
        }, 500)
      }
    }
  }, [paragraphs.length])

  return { getParaRef }
}
