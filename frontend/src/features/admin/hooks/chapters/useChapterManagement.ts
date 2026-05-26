import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetBookByIdQuery } from "@/features/books/api/bookApi";
import {
  useGetAdminChaptersQuery,
  useLazyGetAdminChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useLazyGetChapterByIdQuery,
  useStartChaptersImportMutation,
  useGetChaptersImportStatusQuery,
  useLazyGetChaptersImportStatusQuery,
} from "@/features/chapters/api/chaptersApi";
import {
  useGenerateChapterAudioMutation,
  useGenerateBookAudioMutation,
} from "@/features/tts/api/ttsApi";
import {
  Chapter,
  Paragraph,
  ChaptersImportStatus,
} from "@/features/chapters/types/chapter.interface";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export function useChapterManagement() {
  const params = useParams();
  const bookId = params.bookId as string;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const lastProcessedRef = useRef(-1);

  const [triggerGetChapter, { isFetching: isFetchingDetails }] =
    useLazyGetChapterByIdQuery();
  const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: isUpdating }] = useUpdateChapterMutation();
  const [deleteChapter] = useDeleteChapterMutation();
  const [startChaptersImport, { isLoading: isStartingImport }] =
    useStartChaptersImportMutation();
  const [triggerImportStatus] = useLazyGetChaptersImportStatusQuery();
  const [generateChapterAudio, { isLoading: isGeneratingAudio }] =
    useGenerateChapterAudioMutation();
  const [generateBookAudio, { isLoading: isGeneratingAllAudio }] =
    useGenerateBookAudioMutation();

  const { data: bookData, isLoading: isLoadingBook } =
    useGetBookByIdQuery(bookId);

  const {
    data: chaptersData,
    isFetching: isFetchingChapters,
    isLoading: isLoadingChapters,
    refetch: refetchChaptersQuery,
  } = useGetAdminChaptersQuery(
    {
      bookSlug: bookData?.slug || "",
      page,
      limit: 20,
    },
    {
      skip: !bookData?.slug,
      refetchOnMountOrArgChange: true,
    },
  );



  // Lazy query for direct fetching from polling (no closure issues)
  const [triggerFetchChapters] = useLazyGetAdminChaptersQuery();

  const directFetchChapters = async () => {
    if (!bookData?.slug) return;
    try {
      const result = await triggerFetchChapters(
        { bookSlug: bookData.slug, page: 1, limit: 20 },
        false, // preferCacheValue = false → always fetch fresh from API
      ).unwrap();
      if (isMountedRef.current && result?.chapters) {
        setPage(1);
        setChapters(result.chapters);
        const total = result.total || 0;
        setHasMore(result.chapters.length < total);
      }
    } catch (e) {
      console.error("Direct fetch chapters failed:", e);
    }
  };

  const refetchChapters = () => {
    setChapters([]);
    setPage(1);
    if (bookData?.slug) {
      refetchChaptersQuery();
    }
  };

  // Self-contained import status polling effect
  useEffect(() => {
    if (!activeJobId || !bookData?.slug) return;

    let isCleared = false;
    let pollInterval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const result = await triggerImportStatus(
          {
            bookSlug: bookData.slug,
            jobId: activeJobId,
            timestamp: Date.now(),
          },
          false, // preferCacheValue = false -> force fetch fresh
        ).unwrap();

        if (isCleared) return;

        const { state, progress, result: importResult, failedReason } = result;

        if (progress && typeof progress === "object") {
          const prog = progress as {
            total: number;
            processed: number;
          };

          if (prog.processed > lastProcessedRef.current) {
            lastProcessedRef.current = prog.processed;
            void directFetchChapters();
          }
        }

        if (state === "completed") {
          if (importResult && importResult.failed > 0) {
            toast.warning(
              `Nhập chương sách hoàn tất: thành công ${importResult.successful}/${importResult.total}, ${importResult.failed} lỗi.`,
              { duration: 6000 },
            );
          } else {
            toast.success("Nhập chương sách hoàn tất thành công!", {
              duration: 5000,
            });
          }
          void directFetchChapters();
          cleanup();
        } else if (state === "unknown") {
          toast.success("Nhập chương sách hoàn tất thành công!", {
            duration: 5000,
          });
          void directFetchChapters();
          cleanup();
        } else if (state === "failed") {
          toast.error(
            `Tiến trình nhập sách thất bại: ${failedReason || "Lỗi không xác định"}`,
            { duration: 6000 },
          );
          cleanup();
        }
      } catch (e) {
        console.error("Failed to poll import status:", e);
      }
    };

    const cleanup = () => {
      isCleared = true;
      clearInterval(pollInterval);
      setActiveJobId(null);
    };

    void poll(); // poll immediately
    pollInterval = setInterval(poll, 2000);

    return () => {
      isCleared = true;
      clearInterval(pollInterval);
    };
  }, [activeJobId, bookData?.slug, triggerImportStatus]);

  // Infinite Scroll Effect
  useEffect(() => {
    if (chaptersData?.chapters && !isFetchingChapters) {
      if (page === 1) {
        setChapters(chaptersData.chapters);
      } else {
        setChapters((prev) => [...prev, ...chaptersData.chapters]);
      }
      const total = chaptersData.total || 0;
      const currentCount = (page - 1) * 20 + chaptersData.chapters.length;
      setHasMore(currentCount < total);
    }
  }, [chaptersData, page, isFetchingChapters]);

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



  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingParagraphs, setEditingParagraphs] = useState<Paragraph[]>([]);
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterParagraphs, setNewChapterParagraphs] = useState<Paragraph[]>(
    [{ id: uuidv4(), content: "" }],
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [showGenerateAllConfirm, setShowGenerateAllConfirm] = useState(false);

  const newChapterBottomRef = useRef<HTMLDivElement>(null);
  const editChapterBottomRef = useRef<HTMLDivElement>(null);

  const book = bookData;

  const handleToggleExpand = (chapterId: string, e?: React.MouseEvent) => {
    if (expandedChapterId === chapterId) {
      setExpandedChapterId(null);
      setEditingChapterId(null);
    } else {
      setExpandedChapterId(chapterId);
    }
  };

  // Mở rộng chapter rồi bắt đầu edit — gom 2 action thành 1 handler
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

    try {
      const fullChapter = await triggerGetChapter({
        bookSlug: book.slug,
        chapterId: chapter.id,
      }).unwrap();

      setEditingTitle(fullChapter.title);
      const paras =
        fullChapter.paragraphs && fullChapter.paragraphs.length > 0
          ? fullChapter.paragraphs
          : [{ id: uuidv4(), content: "" }];
      setEditingParagraphs(paras);
    } catch (error) {
      console.error("Failed to fetch:", error);
      setEditingChapterId(null);
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
              : [{ id: uuidv4(), content: " " }],
        },
      }).unwrap();
      setEditingChapterId(null);
      setEditingTitle("");
      setEditingParagraphs([]);
    } catch (error) {
      console.error("Failed to update:", error);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (chapter) {
      setChapterToDelete(chapter);
    }
  };

  const confirmDeleteChapter = async () => {
    if (!book?.slug || !chapterToDelete) return;
    try {
      await deleteChapter({
        bookSlug: book.slug,
        chapterId: chapterToDelete.id,
      }).unwrap();
      if (expandedChapterId === chapterToDelete.id) setExpandedChapterId(null);
      toast.success("Xóa chương thành công");
      setChapterToDelete(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Xóa chương thất bại");
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
          id: uuidv4(),
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
      newParagraphs.splice(index + 1, 0, { id: uuidv4(), content: rightPart });
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
      }).unwrap();
      setShowNewChapterForm(false);
      setNewChapterTitle("");
      setNewChapterParagraphs([{ id: uuidv4(), content: "" }]);
    } catch (error) {
      toast.error(`Tạo thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAudio = async (chapterId: string) => {
    try {
      const ttsResult = await generateChapterAudio({ chapterId }).unwrap();
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
    } catch (error) {
      toast.error(`Tạo audio thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAllAudio = () => {
    setShowGenerateAllConfirm(true);
  };

  const confirmGenerateAllAudio = async () => {
    if (!bookId) return;
    setShowGenerateAllConfirm(false);
    const toastId = toast.loading("Đang tạo audio cho tất cả các chương...");
    try {
      const result = await generateBookAudio({ bookId }).unwrap();
      toast.success(
        `Hoàn thành! Thành công: ${result.successful}/${result.total}, Thất bại: ${result.failed}`,
        { id: toastId },
      );
      refetchChapters();
    } catch (error) {
      toast.error(`Lỗi: ${getErrorMessage(error)}`, { id: toastId });
    }
  };

  const handleImportChapters = async (
    importedChapters: { title: string; content: string }[],
  ) => {
    setIsImportModalOpen(false);
    if (!book?.slug) return toast.error("Thông tin sách không hợp lệ");

    lastProcessedRef.current = -1;

    try {
      const { jobId } = await startChaptersImport({
        bookSlug: book.slug,
        data: { bookId, chapters: importedChapters },
      }).unwrap();

      toast.success(
        `Đã bắt đầu tiến trình nhập ${importedChapters.length} chương ở chế độ nền. Hệ thống sẽ thông báo khi hoàn thành.`,
        { duration: 5000 }
      );
      setActiveJobId(jobId);
    } catch (error) {
      toast.error(`Khởi tạo thất bại: ${getErrorMessage(error)}`);
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
    chapterToDelete,
    showGenerateAllConfirm,
    observerTarget,
    newChapterBottomRef,
    editChapterBottomRef,
    setEditingTitle,
    setEditingParagraphs,
    setShowNewChapterForm,
    setNewChapterTitle,
    setNewChapterParagraphs,
    setIsImportModalOpen,
    setChapterToDelete,
    setShowGenerateAllConfirm,
    handleToggleExpand,
    handleExpandAndEdit,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteChapter,
    confirmDeleteChapter,
    handleParagraphChange,
    handleParagraphKeyDown,
    handleDeleteParagraph,
    handleCreateChapter,
    handleGenerateAudio,
    handleGenerateAllAudio,
    confirmGenerateAllAudio,
    handleImportChapters,
  };
}
