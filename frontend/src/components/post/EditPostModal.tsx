'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useReducer } from 'react';
import { useUpdatePostMutation } from '@/features/posts/api/postApi';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";
import { getErrorMessage, cn } from '@/lib/utils';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useModalStore } from '@/store/useModalStore';

import { Button } from '@/components/ui/button';
import { AppButton } from '../common/AppButton';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const editPostSchema = z.object({
    content: z.string().min(1, 'Vui lòng nhập nội dung bài viết'),
    bookId: z.string().optional(),
});

type EditPostFormValues = z.infer<typeof editPostSchema>;

type PostEditState = {
    existingImages: string[];
    selectedFiles: File[];
    previewUrls: string[];
};

type PostEditAction =
    | { type: 'init'; existingImages: string[]; selectedFiles: File[]; previewUrls: string[] }
    | { type: 'addFiles'; files: File[]; previews: string[] }
    | { type: 'removeExistingImage'; index: number }
    | { type: 'removeNewImage'; index: number };

function postEditReducer(state: PostEditState, action: PostEditAction): PostEditState {
    switch (action.type) {
        case 'init':
            return {
                existingImages: action.existingImages,
                selectedFiles: action.selectedFiles,
                previewUrls: action.previewUrls,
            };
        case 'addFiles':
            return {
                ...state,
                selectedFiles: [...state.selectedFiles, ...action.files],
                previewUrls: [...state.previewUrls, ...action.previews],
            };
        case 'removeExistingImage':
            return {
                ...state,
                existingImages: state.existingImages.filter((_, i) => i !== action.index),
            };
        case 'removeNewImage':
            return {
                ...state,
                selectedFiles: state.selectedFiles.filter((_, i) => i !== action.index),
                previewUrls: state.previewUrls.filter((_, i) => i !== action.index),
            };
    }
}

const initialState: PostEditState = {
    existingImages: [],
    selectedFiles: [],
    previewUrls: [],
};

export default function EditPostModal() {
    const { isEditPostOpen, closeEditPost, editPostData } = useModalStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [updatePost, { isLoading }] = useUpdatePostMutation();

    const post = editPostData?.post;

    const [postEditState, dispatch] = useReducer(
        postEditReducer,
        initialState
    );
    const { existingImages, selectedFiles, previewUrls } = postEditState;

    const form = useForm<EditPostFormValues>({
        resolver: zodResolver(editPostSchema),
        defaultValues: {
            content: '',
            bookId: '',
        },
    });

    const content = useWatch({ control: form.control, name: 'content' });

    const [initializedPostId, setInitializedPostId] = useState<string | null>(null);

    if (isEditPostOpen && post) {
        if (initializedPostId !== post.id) {
            form.reset({
                content: post.content,
                bookId: post.book?.id || '',
            });
            dispatch({
                type: 'init',
                existingImages: post.imageUrls || [],
                selectedFiles: [],
                previewUrls: [],
            });
            setInitializedPostId(post.id);
        }
    } else if (initializedPostId !== null) {
        setInitializedPostId(null);
    }

    const previewUrlsRef = useRef<string[]>([]);
    useEffect(() => {
        previewUrlsRef.current = previewUrls;
    }, [previewUrls]);

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach(URL.revokeObjectURL);
        };
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const currentPostImages = existingImages.length;
        const totalImages = currentPostImages + selectedFiles.length + files.length;

        if (totalImages > 10) {
            toast.error('Tổng số ảnh không được vượt quá 10');
            return;
        }

        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length > 0) {
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            dispatch({ type: 'addFiles', files: validFiles, previews: newPreviews });
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewImage = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        dispatch({ type: 'removeNewImage', index });
    };

    const removeExistingImage = (index: number) => {
        dispatch({ type: 'removeExistingImage', index });
    };

    const onSubmit = async (values: EditPostFormValues) => {
        if (!post) return;

        try {
            const imageUrlsToSend = existingImages.length === 0 ? undefined : existingImages;

            const response = await updatePost({
                id: post.id,
                data: {
                    content: values.content,
                    bookId: values.bookId || undefined,
                    images: selectedFiles.length > 0 ? selectedFiles : undefined,
                    imageUrls: imageUrlsToSend,
                },
            }).unwrap();

            const warningMessage = response.warning;
            if (warningMessage) {
                toast.warning('Bài viết đang được xem xét', {
                    description: warningMessage,
                    duration: 6000,
                });
            }
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('post-updated', { detail: response.data }));
            }
            closeEditPost();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    if (!post) return null;

    return (
        <Dialog open={isEditPostOpen} onOpenChange={(open) => !open && closeEditPost()}>
            <DialogContent className="w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden bg-card rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-white/5 dark:border-gray-800">
                    <DialogTitle className="text-xl font-bold">Chỉnh sửa bài viết</DialogTitle>
                    <DialogDescription className="sr-only">
                        Cập nhật nội dung bài viết của bạn
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="p-6 pb-2">
                            <div className="max-h-[60vh] overflow-y-auto pr-4">
                                <div className="space-y-6">
                                    {/* User info */}
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={post.user?.image || '/abstract-book-pattern.png'}
                                            alt={post.user?.username || 'User'}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-full border border-border object-cover"
                                        />
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-sm text-foreground">
                                                {post.user?.username}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Chia sẻ công khai
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Chia sẻ cảm nhận của bạn về một cuốn sách..."
                                                        className={cn(
                                                            "min-h-[150px] resize-none border-none focus-visible:ring-0 px-0 text-lg shadow-none bg-transparent",
                                                            form.formState.errors.content && "border-destructive focus-visible:ring-destructive"
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Existing images */}
                                    {existingImages && existingImages.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-foreground">
                                                Ảnh hiện tại ({existingImages.length})
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {existingImages.map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-square group rounded-xl overflow-hidden border border-border"
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt={`Existing ${index + 1}`}
                                                            fill
                                                            sizes="(max-width: 640px) 33vw, 25vw"
                                                            className="object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            onClick={() => removeExistingImage(index)}
                                                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 hover:bg-black/75 text-white border-none p-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                                                            disabled={isLoading}
                                                            aria-label="Xóa ảnh hiện tại"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New image previews */}
                                    {previewUrls.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-foreground">
                                                Ảnh mới thêm ({previewUrls.length})
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {previewUrls.map((preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-square group rounded-xl overflow-hidden border border-border"
                                                    >
                                                    <Image
                                                        src={preview}
                                                        alt={`New ${index + 1}`}
                                                        fill
                                                        sizes="(max-width: 640px) 33vw, 25vw"
                                                        className="object-cover"
                                                    />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 hover:bg-black/75 text-white border-none p-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                                                            disabled={isLoading}
                                                            aria-label="Xóa ảnh mới"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-2">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-slate-600 dark:text-gray-300 border-white/10 dark:border-gray-800"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading || existingImages.length + selectedFiles.length >= 10}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Thêm ảnh mới
                                </Button>
                                <span className="text-xs text-muted-foreground italic">
                                    {existingImages.length + selectedFiles.length}/10 ảnh
                                </span>
                            </div>
                        </div>

                        <Separator className="my-2 bg-white/5 dark:bg-gray-800" />

                        <DialogFooter className="px-6 py-4 pt-2">
                            <Button type="button" variant="ghost" onClick={closeEditPost} disabled={isLoading}>
                                Hủy
                            </Button>
                            <AppButton
                                type="submit"
                                loading={isLoading}
                                disabled={!content?.trim()}
                                className="min-w-[120px]"
                            >
                                Lưu thay đổi
                            </AppButton>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
