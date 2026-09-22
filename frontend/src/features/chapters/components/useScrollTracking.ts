'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useReadingRoomStore } from '@/store/useReadingRoomStore'
import { scrollToHighlight } from '@/utils/scroll-to-highlight'

interface Paragraph {
  id: string
  content: string
}

export function useScrollTracking(
  paragraphs: Paragraph[],
  onActiveParagraphChange?: (paragraphId: string | null) => void,
) {
  const paraRefsMap = useRef<Map<string, HTMLElement>>(new Map())

  const registerParaRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      paraRefsMap.current.set(id, el)
    } else {
      paraRefsMap.current.delete(id)
    }
  }, [])

  // IntersectionObserver — active paragraph tracking
  useEffect(() => {
    if (!onActiveParagraphChange) return
    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).dataset.paraId
          if (id) ratios.set(id, e.intersectionRatio)
        })
        let bestId: string | null = null
        let bestRatio = 0
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        })
        onActiveParagraphChange(bestRatio > 0.1 ? bestId : null)
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] },
    )
    paraRefsMap.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [onActiveParagraphChange, paragraphs])

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

  // Paragraph content map for EmotionStream excerpt previews
  useEffect(() => {
    if (!paragraphs || paragraphs.length === 0) return
    const map: Record<string, string> = {}
    for (const p of paragraphs) {
      map[p.id] = p.content
    }
    useReadingRoomStore.getState().setParagraphContentMap(map)
  }, [paragraphs])

  // Scroll to paragraph from EmotionStream click
  const scrollTargetId = useReadingRoomStore((state) => state.scrollTargetParagraphId)
  useEffect(() => {
    if (!scrollTargetId) return
    const el = paraRefsMap.current.get(scrollTargetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      useReadingRoomStore.getState().setScrollTargetParagraphId(null)
    }
  }, [scrollTargetId])

  return { paraRefsMap, registerParaRef }
}
