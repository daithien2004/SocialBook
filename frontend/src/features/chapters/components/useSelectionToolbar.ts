'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAskChapterAI } from '@/features/chapters/api/chaptersApi'
import { useCreateHighlight } from '@/features/user-highlights/api/userHighlightsApi'

export interface Selection {
  text: string
  paraId: string
  rect: DOMRect
}

export interface AiState {
  type: string
  content: string
  isLoading: boolean
}

interface UseSelectionToolbarOptions {
  bookId: string
  chapterId: string
  bookSlug: string
  room: { currentChapterSlug: string } | null
  addHighlight: (data: { chapterSlug: string; paragraphId: string; content: string }) => void
  addQuote: (chapterSlug: string, paraId: string, text: string) => void
}

export function useSelectionToolbar({
  bookId, chapterId, bookSlug,
  room, addHighlight, addQuote,
}: UseSelectionToolbarOptions) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AiState | null>(null)
  const askAI = useAskChapterAI()
  const createPersonalHighlight = useCreateHighlight()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close toolbar on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const sel = window.getSelection()
        if (!sel || sel.toString().trim().length < 5) {
          setSelection(null)
          setAiAnalysis(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseUp = useCallback((paraId: string) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.toString().trim().length < 5) return

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSelection({ text: sel.toString(), paraId, rect })
    setAiAnalysis(null)
  }, [])

  const handleAIAction = useCallback(async (type: 'explain' | 'summarize' | 'character' | 'translate') => {
    if (!selection) return

    const prompts = {
      explain: `Giải thích ý nghĩa và ngữ cảnh của đoạn văn này trong truyện: "${selection.text}"`,
      summarize: `Tóm tắt ngắn gọn và súc tích đoạn văn này: "${selection.text}"`,
      character: `Phân tích tâm lý, hành động hoặc vai trò của các nhân vật xuất hiện trong đoạn này: "${selection.text}"`,
      translate: `Dịch đoạn văn này sang tiếng Việt một cách mượt mà và giải thích các thuật ngữ khó (nếu có): "${selection.text}"`,
    }

    setAiAnalysis({ type, content: '', isLoading: true })

    try {
      const response = await askAI.mutateAsync({ bookSlug, chapterId, question: prompts[type] })
      setAiAnalysis({ type, content: response.answer, isLoading: false })
    } catch {
      toast.error('AI không thể xử lý lúc này.')
      setAiAnalysis(null)
    }
  }, [selection, askAI, bookSlug, chapterId])

  const isMultiParagraphSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    const startPara = range.startContainer instanceof Element
      ? range.startContainer.closest('[data-para-id]')
      : range.startContainer.parentElement?.closest('[data-para-id]')
    const endPara = range.endContainer instanceof Element
      ? range.endContainer.closest('[data-para-id]')
      : range.endContainer.parentElement?.closest('[data-para-id]')
    return !!startPara && !!endPara && startPara !== endPara
  }, [])

  const rejectMultiParagraph = useCallback(() => {
    toast.warning('Chỉ hỗ trợ highlight 1 đoạn')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  const handleAddHighlight = useCallback(() => {
    if (!selection || !room) return
    if (isMultiParagraphSelection()) { rejectMultiParagraph(); return }
    addHighlight({
      chapterSlug: room.currentChapterSlug,
      paragraphId: selection.paraId,
      content: selection.text.replace(/\s+/g, ' ').trim(),
    })
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, room, addHighlight, isMultiParagraphSelection, rejectMultiParagraph])

  const handleAddQuote = useCallback(() => {
    if (!selection || !room) return
    addQuote(room.currentChapterSlug, selection.paraId, selection.text)
    toast.success('Đã thêm trích dẫn!')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, room, addQuote])

  const handleAddPersonalHighlight = useCallback(async () => {
    if (!selection) return
    if (isMultiParagraphSelection()) { rejectMultiParagraph(); return }
    try {
      await createPersonalHighlight.mutateAsync({
        bookId, chapterId, paragraphId: selection.paraId,
        content: selection.text.replace(/\s+/g, ' ').trim(),
      })
      toast.success('Đã lưu highlight cá nhân')
    } catch {
      toast.error('Không thể lưu highlight cá nhân')
    }
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, bookId, chapterId, createPersonalHighlight, isMultiParagraphSelection, rejectMultiParagraph])

  return {
    selection,
    aiAnalysis,
    setAiAnalysis,
    menuRef,
    handleMouseUp,
    handleAIAction,
    handleAddHighlight,
    handleAddPersonalHighlight,
    handleAddQuote,
  }
}
