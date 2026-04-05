'use client';

import Image from 'next/image';
import { useAppAuth } from '@/features/auth/hooks';
import { ImagePlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { AppButton } from '../common/AppButton';
import { useCreatePost } from '@/features/posts/hooks/useCreatePost';

export default function CreatePostModal() {
  const { isCreatePostOpen, closeCreatePost, createPostData } = useModalStore();
  const {
    title = 'Tạo bài viết mới',
    contentPlaceholder = 'Chia sẻ suy nghĩ của bạn...',
    maxImages = 10,
    defaultContent = '',
    onSubmit: externalOnSubmit,
  } = createPostData;

  const { isAuthenticated } = useAppAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { form, previewUrls, isSubmitting, handleFileSelect, handleRemoveImage, canAddMore, totalImages } = useCreatePost({
    defaultContent,
    maxImages,
    onSubmit: async (values) => {
      if (externalOnSubmit) {
        await externalOnSubmit(values);
      }
      closeCreatePost();
      form.reset();
    },
  });

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

  if (!isAuthenticated) return null;

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
          <form onSubmit={form.handleSubmit(form.handleSubmit as any)}>
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
                  onChange={(e) => handleFileSelect(e.target.files)}
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
                disabled={!form.watch('content')?.trim()}
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
