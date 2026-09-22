'use client'

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Highlighter, QuoteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownText } from '@/components/shared/MarkdownText'
import type { Selection, AiState } from './useSelectionToolbar'

interface SelectionToolbarProps {
  selection: Selection | null
  aiAnalysis: AiState | null
  setAiAnalysis: (v: AiState | null) => void
  menuRef: React.RefObject<HTMLDivElement | null>
  user: { id: string } | undefined
  room: object | null
  isEnded: boolean
  onAI: (type: 'explain' | 'summarize' | 'character' | 'translate') => void
  onHighlightRoom: () => void
  onHighlightPersonal: () => void
  onQuote: () => void
}

export function SelectionToolbar({
  selection,
  aiAnalysis,
  setAiAnalysis,
  menuRef,
  user,
  room,
  isEnded,
  onAI,
  onHighlightRoom,
  onHighlightPersonal,
  onQuote,
}: SelectionToolbarProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!isMounted || !document.body?.isConnected || !selection) return null

  return createPortal(
    <AnimatePresence>
      <div
        ref={menuRef}
        className="fixed z-50 pointer-events-none"
        style={{
          top: selection.rect.top,
          left: selection.rect.left + (selection.rect.width / 2),
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="pointer-events-auto flex items-center gap-0.5 p-1 bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-lg -translate-x-1/2 -translate-y-[110%]"
        >
          <Button
            title="Giải thích AI"
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-md p-0 text-foreground hover:bg-accent"
            onClick={() => onAI('explain')}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>

          {user && !room && (
            <>
              <div className="w-[1px] h-4 bg-border mx-1" />
              <Button
                title="Highlight"
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-md p-0 text-foreground hover:bg-accent"
                onClick={onHighlightPersonal}
              >
                <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
              </Button>
            </>
          )}

          {room && !isEnded && (
            <>
              <div className="w-[1px] h-4 bg-border mx-1" />
              <Button
                title="Highlight"
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-md p-0 text-foreground hover:bg-accent"
                onClick={onHighlightRoom}
              >
                <Highlighter className="w-3.5 h-3.5" />
              </Button>

              <Button
                title="Trích dẫn"
                size="sm"
                variant="ghost"
                className="h-8 rounded-md gap-1.5 px-2 text-foreground hover:bg-accent"
                onClick={onQuote}
              >
                <QuoteIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold">Trích dẫn</span>
              </Button>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="pointer-events-auto absolute top-2 left-0 -translate-x-1/2 w-80 max-h-60 overflow-hidden rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/15 dark:shadow-black/60 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                    AI {aiAnalysis.type === 'explain' ? 'Giải thích' : aiAnalysis.type === 'summarize' ? 'Tóm tắt' : aiAnalysis.type === 'character' ? 'Nhân vật' : 'Dịch thuật'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setAiAnalysis(null)}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>

              <ScrollArea className="h-40 pr-2">
                {aiAnalysis.isLoading ? (
                  <div className="flex flex-col gap-2 py-4">
                    <div className="h-3 w-3/4 bg-muted rounded-full animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded-full animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-foreground">
                    <MarkdownText text={aiAnalysis.content} />
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body,
  )
}
