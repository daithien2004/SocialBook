'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';

interface Paragraph {
    id: string;
    content: string;
}

interface UseChapterCommentsOptions {
    bookId: string;
    bookTitle?: string;
}

export function useChapterComments({ bookId, bookTitle }: UseChapterCommentsOptions) {
    const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
    const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
    const [activeParagraph, setActiveParagraph] = useState<Paragraph | null>(null);

    const { openCreatePost } = useModalStore();
    const [createPost] = useCreatePostMutation();

    const handleToggleComments = useCallback((paragraph: Paragraph) => {
        setActiveParagraphId(paragraph.id);
        setActiveParagraph(paragraph);
        setCommentDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setCommentDrawerOpen(false);
        setActiveParagraphId(null);
        setActiveParagraph(null);
    }, []);

    const handleOpenPostModal = useCallback((paragraph: Paragraph) => {
        openCreatePost({
            title: `Chia sẻ trích dẫn${bookTitle ? ` từ "${bookTitle}"` : ''}`,
            contentPlaceholder: "Nội dung trích dẫn...",
            defaultContent: paragraph.content,
            onSubmit: async (data) => {
                if (!bookId) {
                    toast.error('Không tìm thấy thông tin sách');
                    return;
                }
                try {
                    const result = await createPost({
                        bookId: bookId,
                        content: data.content,
                        images: data.images,
                    }).unwrap();

                    if (result.warning) {
                        toast.warning('Bài viết đang được xem xét', {
                            description: result.warning,
                            duration: 5000,
                        });
                    } else {
                        toast.success('Chia sẻ thành công!');
                    }
                } catch (error: unknown) {
                    toast.error(getErrorMessage(error));
                }
            },
        });
    }, [bookId, bookTitle, openCreatePost, createPost]);

    return {
        activeParagraphId,
        commentDrawerOpen,
        activeParagraph,
        handleToggleComments,
        handleCloseDrawer,
        handleOpenPostModal,
    };
}
