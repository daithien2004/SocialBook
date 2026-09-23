import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookQueries } from "@/features/books/api/books.queries";
import {
  chaptersQueries,
} from "@/features/chapters/api/chapters.queries";
import {
  getChapterById,
  getChaptersImportStatus,
} from "@/features/chapters/api/chapters.api";
import {
  useCreateChapter,
  useDeleteChapter,
  useStartChaptersImport,
  useUpdateChapter,
} from "@/features/chapters/api/chapters.mutations";
import {
  useGenerateBookAudio,
  useGenerateChapterAudio,
} from "@/features/tts/api/tts.mutations";
import type {
  Chapter,
  Paragraph,
} from "@/features/chapters/types/chapter.interface";
import { getErrorMessage } from '@/lib/utils';

export function useChapterManagement() {
  const params = useParams();
  const bookId = params.bookId as string;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const shouldRefetchRef = useRef(false);

  const { data: bookData, isLoading: isLoadingBook } =
    useQuery(bookQueries.byId(bookId));

  const {
    data: chaptersData,
    isFetching: isFetchingChapters,
    isLoading: isLoadingChapters,
    refetch: refetchChaptersQuery,
  } = useQuery({
    ...chaptersQueries.adminList({
      bookSlug: bookData?.slug || "",
      page,
      limit: 20,
    }),
    enabled: !!bookData?.slug,
  });

  const refetchChapters = () => {
    setChapters([]);
    if (page === 1) {
      if (bookData?.slug) {
        refetchChaptersQuery();
      }
    } else {
      shouldRefetchRef.current = true;
      setPage(1);
    }
  };

  useEffect(() => {
    if (page === 1 && shouldRefetchRef.current) {
      shouldRefetchRef.current = false;
      if (bookData?.slug) {
        refetchChaptersQuery();
      }
    }
  }, [page, bookData?.slug, refetchChaptersQuery]);

  const [processedPage, setProcessedPage] = useState(0);

  if (chaptersData?.chapters && !isFetchingChapters && page !== processedPage) {
    setProcessedPage(page);
    if (page === 1) {
      setChapters(chaptersData.chapters);
    } else {
      setChapters((prev) => [...prev, ...chaptersData.chapters]);
    }
    const total = chaptersData.total || 0;
    const currentCount = (page - 1) * 20 + chaptersData.chapters.length;
    setHasMore(currentCount < total);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingChapters) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "500px" },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingChapters]);

  const { mutateAsync: createChapter, isPending: isCreating } = useCreateChapter();
  const { mutateAsync: updateChapter, isPending: isUpdating } = useUpdateChapter();
  const { mutateAsync: deleteChapter } = useDeleteChapter();
  const { mutateAsync: startChaptersImport, isPending: isStartingImport } =
    useStartChaptersImport();
  const { mutateAsync: generateChapterAudio } = useGenerateChapterAudio();
  const { mutateAsync: generateBookAudio, isPending: isGeneratingAllAudio } =
    useGenerateBookAudio();

  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingParagraphs, setEditingParagraphs] = useState<Paragraph[]>([]);
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterParagraphs, setNewChapterParagraphs] = useState<Paragraph[]>(
    [{ id: crypto.randomUUID(), content: "" }],
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const newChapterBottomRef = useRef<HTMLDivElement>(null);
  const editChapterBottomRef = useRef<HTMLDivElement>(null);

  const book = bookData;

  const handleToggleExpand = (chapterId: string) => {
    if (expandedChapterId === chapterId) {
      setExpandedChapterId(null);
      setEditingChapterId(null);
    } else {
      setExpandedChapterId(chapterId);
    }
  };

  const handleExpandAndEdit = (chapter: Chapter) => {
    if (expandedChapterId !== chapter.id) {
      setExpandedChapterId(chapter.id);
    }
    handleStartEdit(chapter);
  };

  const handleStartEdit = async (chapter: Chapter) => {
    if (!book?.slug) return;
    setEditingChapterId(chapter.id);
    setEditingTitle(chapter.title);
    setEditingParagraphs([]);
    setIsFetchingDetails(true);

    try {
      const fullChapter = await getChapterById({
        bookSlug: book.slug,
        chapterId: chapter.id,
      });

      setEditingTitle(fullChapter.title);
      const paras =
        fullChapter.paragraphs && fullChapter.paragraphs.length > 0
          ? fullChapter.paragraphs
          : [{ id: crypto.randomUUID(), content: "" }];
      setEditingParagraphs(paras);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setEditingChapterId(null);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChapterId(null);
    setEditingTitle("");
    setEditingParagraphs([]);
  };

  const handleSaveEdit = async (chapterId: string) => {
    if (!book?.slug) return;
    try {
      await updateChapter({
        bookSlug: book.slug,
        chapterId,
        data: {
          title: editingTitle,
          paragraphs:
            editingParagraphs.filter((p) => p.content.trim()).length > 0
              ? editingParagraphs.filter((p) => p.content.trim())
              : [{ id: crypto.randomUUID(), content: " " }],
        },
      });
      setEditingChapterId(null);
      setEditingTitle("");
      setEditingParagraphs([]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!book?.slug) return;
    if (!confirm("Bạn có chắc muốn xóa chương này?")) return;

    try {
      await deleteChapter({ bookSlug: book.slug, chapterId });
      if (expandedChapterId === chapterId) setExpandedChapterId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleParagraphChange = (
    index: number,
    content: string,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void,
    onPaste?: () => void,
  ) => {
    const isPaste = content.length - paragraphs[index].content.length > 5;
    if (content.includes("\n") || (isPaste && /[.!?]\s/.test(content))) {
      const segments = content
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (segments.length > 1) {
        const newParagraphs = paragraphs.map((p) => ({ ...p }));
        newParagraphs[index].content = segments[0];
        const newItems = segments.slice(1).map((line) => ({
          id: crypto.randomUUID(),
          content: line,
        }));
        newParagraphs.splice(index + 1, 0, ...newItems);
        setParagraphs(newParagraphs);
        if (onPaste) setTimeout(onPaste, 100);
        return;
      }
    }
    const newParagraphs = paragraphs.map((p) => ({ ...p }));
    newParagraphs[index].content = content;
    setParagraphs(newParagraphs);
  };

  const handleParagraphKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const cursorPosition = e.currentTarget.selectionStart;
      const content = paragraphs[index].content;
      const leftPart = content.slice(0, cursorPosition);
      const rightPart = content.slice(cursorPosition);
      const newParagraphs = paragraphs.map((p) => ({ ...p }));
      newParagraphs[index].content = leftPart;
      newParagraphs.splice(index + 1, 0, { id: crypto.randomUUID(), content: rightPart });
      setParagraphs(newParagraphs);

      setTimeout(() => {
        const allTextareas = Array.from(document.querySelectorAll("textarea"));
        const currentIdx = allTextareas.indexOf(e.currentTarget);
        if (currentIdx !== -1 && currentIdx + 1 < allTextareas.length) {
          const nextTextarea = allTextareas[
            currentIdx + 1
          ] as HTMLTextAreaElement;
          nextTextarea.focus();
          nextTextarea.setSelectionRange(0, 0);
        }
      }, 0);
    } else if (
      e.key === "Backspace" &&
      paragraphs[index].content === "" &&
      paragraphs.length > 1
    ) {
      e.preventDefault();
      const newParagraphs = paragraphs
        .map((p) => ({ ...p }))
        .filter((_, i) => i !== index);
      setParagraphs(newParagraphs);
      setTimeout(() => {
        const newTextareas = document.querySelectorAll("textarea");
        if (index > 0 && newTextareas[index - 1]) {
          const el = newTextareas[index - 1] as HTMLTextAreaElement;
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 0);
    }
  };

  const handleDeleteParagraph = (
    index: number,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void,
  ) => {
    if (paragraphs.length === 1) return;
    const newParagraphs = paragraphs
      .map((p) => ({ ...p }))
      .filter((_, i) => i !== index);
    setParagraphs(newParagraphs);
  };

  const handleCreateChapter = async () => {
    if (!bookId) return toast.error("Không tìm thấy ID sách.");
    if (!newChapterTitle.trim())
      return toast.info("Vui lòng nhập tiêu đề chương");

    try {
      await createChapter({
        bookSlug: book?.slug || "",
        data: {
          title: newChapterTitle,
          bookId,
          paragraphs: newChapterParagraphs.filter((p) => p.content.trim()),
        },
      });
      setShowNewChapterForm(false);
      setNewChapterTitle("");
      setNewChapterParagraphs([{ id: crypto.randomUUID(), content: "" }]);
    } catch (error: unknown) {
      toast.error(`Tạo thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAudio = async (chapterId: string) => {
    try {
      const ttsResult = await generateChapterAudio({ chapterId });
      toast.success("Tạo audio thành công!");
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === chapterId
            ? {
                ...ch,
                ttsStatus: "completed" as const,
                audioUrl: ttsResult.audioUrl,
              }
            : ch,
        ),
      );
      refetchChaptersQuery();
    } catch (error: unknown) {
      toast.error(`Tạo audio thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAllAudio = async () => {
    if (!bookId) return;
    if (
      !confirm(
        `Bạn có chắc muốn tạo audio cho tất cả ${chapters.length} chương?`,
      )
    )
      return;
    try {
      const result = await generateBookAudio({ bookId });
      alert(
        `Hoàn thành!\nThành công: ${result.successful}/${result.total}\nThất bại: ${result.failed}`,
      );
      refetchChapters();
    } catch (error: unknown) {
      alert(`Lỗi: ${getErrorMessage(error)}`);
    }
  };

  const handleImportChapters = async (
    importedChapters: { title: string; content: string }[],
  ) => {
    setIsImportModalOpen(false);
    if (!book?.slug) return toast.error("Book information missing");

    const toastId = toast.loading(
      `Đang tạo job import ${importedChapters.length} chương...`,
    );
    try {
      const { jobId } = await startChaptersImport({
        bookSlug: book.slug,
        data: { bookId, chapters: importedChapters },
      });

      toast.loading(`Đang import... (job: ${jobId})`, { id: toastId });
      const startedAt = Date.now();
      const POLL_MS = 2000;
      const TIMEOUT_MS = 30 * 60 * 1000;

      while (true) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          toast.error("Import quá lâu, vui lòng thử lại.", { id: toastId });
          break;
        }

        const status = await getChaptersImportStatus({ bookSlug: book.slug, jobId, timestamp: Date.now() });
        if (status?.state === "completed") {
          const result = status.result;
          if (result && result.failed > 0) {
            toast.warning(
              `Thành công ${result.successful}/${result.total}, ${result.failed} lỗi.`,
              { id: toastId },
            );
          } else {
            toast.success("Import hoàn tất!", { id: toastId });
          }
          refetchChapters();
          break;
        }

        if (status?.state === "unknown") {
          toast.success("Import hoàn tất!", { id: toastId });
          refetchChapters();
          break;
        }

        if (status?.state === "failed") {
          toast.error(
            `Import thất bại: ${status.failedReason || "Lỗi không xác định"}`,
            { id: toastId },
          );
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  };

  return {
    bookId,
    book,
    chapters,
    isLoadingBook,
    isLoadingChapters,
    isFetchingChapters,
    isFetchingDetails,
    isCreating,
    isUpdating,
    isGeneratingAllAudio,
    isStartingImport,
    page,
    expandedChapterId,
    editingChapterId,
    editingTitle,
    editingParagraphs,
    showNewChapterForm,
    newChapterTitle,
    newChapterParagraphs,
    isImportModalOpen,
    observerTarget,
    newChapterBottomRef,
    editChapterBottomRef,
    setEditingTitle,
    setEditingParagraphs,
    setShowNewChapterForm,
    setNewChapterTitle,
    setNewChapterParagraphs,
    setIsImportModalOpen,
    handleToggleExpand,
    handleExpandAndEdit,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteChapter,
    handleParagraphChange,
    handleParagraphKeyDown,
    handleDeleteParagraph,
    handleCreateChapter,
    handleGenerateAudio,
    handleGenerateAllAudio,
    handleImportChapters,
  };
}
