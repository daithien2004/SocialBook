'use client';

import Image from 'next/image';
import { useAppAuth } from '@/hooks/useAppAuth';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useModalStore } from '@/store/useModalStore';

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AppButton } from '../common/AppButton';

const createPostSchema = z.object({
  content: z.string().min(1, 'Vui lòng nhập nội dung bài viết'),
  images: z.array(z.instanceof(File)).max(10, 'Chỉ có thể thêm tối đa 10 ảnh'),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

export default function CreatePostModal() {
  const { isCreatePostOpen, closeCreatePost, createPostData } = useModalStore();
  const {
    title = 'Tạo bài viết mới',
    contentPlaceholder = 'Chia sẻ suy nghĩ của bạn...',
    maxImages = 10,
    defaultContent = '',
    onSubmit: externalOnSubmit,
  } = createPostData;

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useAppAuth();
  const router = useRouter();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: defaultContent,
      images: [],
    },
  });

  const { watch, setValue, reset } = form;
  const currentImages = watch('images') || [];
  const currentContent = watch('content') || '';

  useEffect(() => {
    if (isCreatePostOpen && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đăng bài viết', {
        action: {
          label: 'Đăng nhập',
          onClick: () => router.push('/login'),
        },
      });
      closeCreatePost();
    }
  }, [isCreatePostOpen, isAuthenticated, closeCreatePost, router]);

  useEffect(() => {
    if (isCreatePostOpen) {
      reset({
        content: defaultContent,
        images: [],
      });
      setPreviewUrls([]);
    } else {
      // Cleanup previews
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    }
  }, [isCreatePostOpen, defaultContent, reset]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const totalImages = currentImages.length + filesArray.length;

    if (totalImages > maxImages) {
      toast.error(`Chỉ có thể thêm tối đa ${maxImages} ảnh`);
      return;
    }

    const validFiles = filesArray.filter((file) => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`File ${file.name} không phải là hình ảnh`);
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      const updatedImages = [...currentImages, ...validFiles];
      setValue('images', updatedImages);
      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const updatedImages = currentImages.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setValue('images', updatedImages);
    setPreviewUrls(updatedPreviews);
  };

  const onSubmit = async (values: CreatePostFormValues) => {
    if (!externalOnSubmit) return;
    
    setIsSubmitting(true);
    try {
      await externalOnSubmit(values);
      closeCreatePost();
      reset();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  const totalImages = currentImages.length;
  const canAddMore = totalImages < maxImages;

  return (
    <Dialog open={isCreatePostOpen} onOpenChange={(open) => !open && closeCreatePost()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white dark:bg-[#1a1a1a]">
        <DialogHeader className="px-6 py-4 border-b border-white/5 dark:border-gray-800">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new post to share with your friends
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 pb-2">
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={contentPlaceholder}
                            className="min-h-[150px] resize-none border-none focus-visible:ring-0 px-0 text-lg shadow-none bg-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-md border border-white/5 dark:border-gray-800 p-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                          <Image
                            src={url}
                            alt={`Preview ${index}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
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
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-slate-600 dark:text-gray-300 border-white/10 dark:border-gray-800"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAddMore}
                >
                  <ImagePlus className="w-4 h-4" />
                  Thêm ảnh
                </Button>
                <span className="text-xs text-muted-foreground">
                  {totalImages}/{maxImages} ảnh
                </span>
              </div>
            </div>

            <Separator className="my-2 bg-white/5 dark:bg-gray-800" />

            <DialogFooter className="px-6 py-4 pt-2">
              <Button type="button" variant="ghost" onClick={closeCreatePost} disabled={isSubmitting}>
                Hủy
              </Button>
              <AppButton
                type="submit"
                loading={isSubmitting}
                disabled={!currentContent.trim()}
                className="min-w-[100px]"
              >
                Đăng bài
              </AppButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
