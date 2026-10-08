'use client';

import React, { useState, memo } from 'react';
import { User, Trash2, Sparkles, Highlighter } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { useUpdateHighlight } from '@/features/user-highlights/api/user-highlights.mutations';
import type { UserHighlight } from '@/features/user-highlights/types/user-highlight.interface';
import type { RoomHighlight } from '@/store/useReadingRoomStore';

interface ChapterTextRendererProps {
  content: string;
  highlights: RoomHighlight[];
  userHighlights?: UserHighlight[];
  currentUserId?: string;
  onRemoveHighlight?: (highlightId: string) => void;
  onRemoveUserHighlight?: (highlightId: string) => void;
  generateHighlightInsight?: (highlightId: string) => void;
}

export const ChapterTextRenderer = ({
  content,
  highlights,
  userHighlights,
  currentUserId,
  onRemoveHighlight,
  onRemoveUserHighlight,
  generateHighlightInsight,
}: ChapterTextRendererProps) => {
  const [generatingInsightId, setGeneratingInsightId] = useState<string | null>(
    null,
  );

  let parts: (string | React.ReactNode)[] = [content];

  // 1. Process Highlights (Background)
  highlights.forEach((h) => {
    const newParts: (string | React.ReactNode)[] = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') {
        newParts.push(part);
        return;
      }

      const index = part.indexOf(h.content);
      if (index === -1) {
        newParts.push(part);
      } else {
        newParts.push(part.substring(0, index));
        newParts.push(
          <Popover key={`h-${h.id}-${index}`}>
            <PopoverTrigger asChild>
              <span className="bg-warning/20 dark:bg-warning/30 border-b-2 border-warning/50 cursor-pointer transition-all hover:bg-warning/30">
                {h.content}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 border-none bg-transparent shadow-none"
              side="top"
              align="center"
              sideOffset={10}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-64 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                      {h.displayName || 'Thành viên'} highlight
                    </span>
                  </div>
                  {currentUserId &&
                    h.userId === currentUserId &&
                    onRemoveHighlight && (
                      <button
                        className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHighlight(h.id);
                        }}
                        title="Xóa highlight"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                </div>

                {h.aiInsight ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      AI INSIGHT
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground italic">
                      &ldquo;{h.aiInsight}&rdquo;
                    </p>
                  </div>
                ) : generatingInsightId === h.id ? (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    AI đang suy nghĩ...
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-[11px] font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGeneratingInsightId(h.id);
                      generateHighlightInsight?.(h.id);
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Giải thích bằng AI
                  </button>
                )}
              </motion.div>
            </PopoverContent>
          </Popover>,
        );
        newParts.push(part.substring(index + h.content.length));
      }
    });
    parts = newParts;
  });

  // 2. Process Personal Highlights
  if (userHighlights && userHighlights.length > 0) {
    userHighlights.forEach((h) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const index = part.indexOf(h.content);
        if (index === -1) {
          newParts.push(part);
        } else {
          newParts.push(part.substring(0, index));
          newParts.push(
            <PersonalHighlightPopover
              key={`uh-${h.id}-${index}`}
              highlight={h}
              onRemoveUserHighlight={onRemoveUserHighlight}
            />,
          );
          newParts.push(part.substring(index + h.content.length));
        }
      });
      parts = newParts;
    });
  }

  return <>{parts}</>;
};

const PersonalHighlightPopover = memo(function PersonalHighlightPopover({
  highlight: h,
  onRemoveUserHighlight,
}: {
  highlight: UserHighlight;
  onRemoveUserHighlight?: (id: string) => void;
}) {
  const updateHighlight = useUpdateHighlight();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(h.note || '');

  const handleSaveNote = async () => {
    await updateHighlight.mutateAsync({ id: h.id, note: noteContent });
    setIsEditingNote(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className="cursor-pointer transition-all hover:opacity-80 rounded-sm px-0.5"
          style={{
            backgroundColor: `${h.color}40`,
            borderBottom: `2px solid ${h.color}`,
          }}
        >
          {h.content}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border-none bg-transparent shadow-none"
        side="top"
        align="center"
        sideOffset={10}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-64 p-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${h.color}20` }}
              >
                <Highlighter
                  className="w-3.5 h-3.5"
                  style={{ color: h.color }}
                />
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">
                Highlight cá nhân
              </span>
            </div>
            {onRemoveUserHighlight && (
              <button
                className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveUserHighlight(h.id);
                }}
                title="Xóa highlight"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {isEditingNote ? (
            <div className="space-y-2">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Viết ghi chú..."
                className="text-xs min-h-[60px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setIsEditingNote(false)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={handleSaveNote}
                >
                  Lưu
                </Button>
              </div>
            </div>
          ) : h.note ? (
            <div
              className="space-y-1 bg-muted p-2.5 rounded-xl border border-border/50 cursor-text hover:border-primary/30 transition-colors"
              onClick={() => setIsEditingNote(true)}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Ghi chú
              </span>
              <p className="text-xs text-foreground leading-relaxed">
                {h.note}
              </p>
            </div>
          ) : (
            <div className="text-center py-2 space-y-2">
              <p className="text-[11px] text-muted-foreground italic">
                Chưa có ghi chú nào.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] w-full"
                onClick={() => setIsEditingNote(true)}
              >
                Thêm ghi chú
              </Button>
            </div>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  );
});
