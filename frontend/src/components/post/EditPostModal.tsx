'use client';

import Image from 'next/image';
import { useEffect, useRef, useMemo } from 'react';
import { useUpdatePostMutation } from '@/features/posts/api/postApi';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import BookSelector from './BookSelector';
import { toast } from "sonner";
import { getErrorMessage, cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
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
    FormLabel,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const editPostSchema = z.object({
    content: z.string().min(1, 'Vui lòng nhập nội dung bài viết'),
    bookId: z.string().optional(),
    images: z.array(z.instanceof(File)),
});

type EditPostFormValues = z.infer<typeof editPostSchema>;

export default function EditPostModal() {
    const { isEditPostOpen, closeEditPost, editPostData } = useModalStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [updatePost, { isLoading }] = useUpdatePostMutation();

    const post = editPostData?.post;

    const form = useForm<EditPostFormValues>({
        resolver: zodResolver(editPostSchema),
        defaultValues: {
            content: '',
            bookId: '',
            images: [],
        },
    });

    const newImages = form.watch('images') || [];
    const content = form.watch('content');

    // Reset form when modal opens with new post data
    useEffect(() => {
        if (isEditPostOpen && post) {
            form.reset({
                content: post.content,
                bookId: post.book?.id || '',
                images: [],
            });
        }
    }, [isEditPostOpen, post, form]);

    const newImagePreviews = useMemo(() => {
        return newImages.map(file => URL.createObjectURL(file));
    }, [newImages]);

    useEffect(() => {
        return () => {
            newImagePreviews.forEach(URL.revokeObjectURL);
        };
    }, [newImagePreviews]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const currentPostImages = post?.imageUrls?.length || 0;
        const totalImages = currentPostImages + newImages.length + files.length;

        if (totalImages > 10) {
            toast.error('Tổng số ảnh không được vượt quá 10');
            return;
        }

        form.setValue('images', [...newImages, ...files]);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewImage = (index: number) => {
        form.setValue('images', newImages.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: EditPostFormValues) => {
        if (!post) return;

        try {
            await updatePost({
                id: post.id,
                data: {
                    content: values.content,
                    bookId: values.bookId || undefined,
                    images: values.images && values.images.length > 0 ? values.images : undefined,
                },
            }).unwrap();
            toast.success('Cập nhật bài viết thành công! 🎉');
            closeEditPost();
        } catch (error: any) {
            console.error('Failed to update post:', error);
            if (error?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    };

    if (!post) return null;

    return (
        <Dialog open={isEditPostOpen} onOpenChange={(open) => !open && closeEditPost()}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white dark:bg-[#1a1a1a]">
                <DialogHeader className="px-6 py-4 border-b border-white/5 dark:border-gray-800">
                    <DialogTitle className="text-xl font-bold">Chỉnh sửa bài viết</DialogTitle>
                    <DialogDescription className="sr-only">
                        Cập nhật nội dung bài viết của bạn
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="p-6 pb-2">
                            <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-6">
                                    {/* User info */}
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={post.user?.image || '/abstract-book-pattern.png'}
                                            alt={post.user?.username || 'User'}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-full border border-slate-200 dark:border-gray-700 object-cover"
                                        />
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-gray-100">
                                                {post.user?.username}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400">
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

                                    {/* Book selector */}
                                    <FormField
                                        control={form.control}
                                        name="bookId"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2 pb-2">
                                                <FormLabel className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                                    Chọn sách
                                                </FormLabel>
                                                <FormControl>
                                                    <BookSelector
                                                        value={field.value}
                                                        onChange={(id) => field.onChange(id)}
                                                        disabled={isLoading}
                                                        onlyLibrary
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Existing images */}
                                    {post.imageUrls && post.imageUrls.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                                Ảnh hiện tại ({post.imageUrls.length})
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {post.imageUrls.map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-gray-800"
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt={`Existing ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <span className="text-[10px] font-medium text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                                                Đã lưu
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-gray-400 italic">
                                                * Để xóa ảnh cũ, vui lòng thao tác trực tiếp tại bài viết
                                            </p>
                                        </div>
                                    )}

                                    {/* New image previews */}
                                    {newImagePreviews.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                                Ảnh mới thêm ({newImagePreviews.length})
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {newImagePreviews.map((preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-square group rounded-xl overflow-hidden border border-slate-100 dark:border-gray-800"
                                                    >
                                                        <Image
                                                            src={preview}
                                                            alt={`New ${index + 1}`}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={isLoading}
                                                            aria-label="Xóa ảnh mới"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
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
                                    disabled={isLoading || (post.imageUrls?.length || 0) + newImages.length >= 10}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Thêm ảnh mới
                                </Button>
                                <span className="text-xs text-muted-foreground italic">
                                    {(post.imageUrls?.length || 0) + newImages.length}/10 ảnh
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
