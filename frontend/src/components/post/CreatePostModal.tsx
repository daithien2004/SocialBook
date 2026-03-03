'use client';

import { useAppAuth } from '@/hooks/useAppAuth';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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

export interface CreatePostModalProps {
  isSubmitting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
  defaultContent?: string;
  title?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  maxImages?: number;
}

export interface CreatePostData {
  content: string;
  images: File[];
}

export default function CreatePostModal({
  isSubmitting,
  isOpen,
  onClose,
  onSubmit,
  defaultContent = '',
  title = 'Tạo bài viết mới',
  contentLabel = 'Nội dung',
  contentPlaceholder = 'Chia sẻ suy nghĩ của bạn...',
  maxImages = 10,
}: CreatePostModalProps) {
  const [content, setContent] = useState(defaultContent);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đăng bài viết', {
        action: {
          label: 'Đăng nhập',
          onClick: () => router.push('/login'),
        },
      });
      onClose();
    }
  }, [isOpen, isAuthenticated, onClose, router]);

  useEffect(() => {
    if (isOpen) {
      setContent(defaultContent);
    } else {
      // Cleanup previews when modal closes
      setPreviewUrls((prevUrls) => {
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setImages([]);
    }
  }, [isOpen, defaultContent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const totalImages = images.length + filesArray.length;

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
      setImages([...images, ...validFiles]);
      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      await onSubmit({
        content: trimmedContent,
        images,
      });
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Có lỗi xảy ra khi đăng bài');
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isAuthenticated) return null;

  const totalImages = images.length;
  const canAddMore = totalImages < maxImages;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white dark:bg-[#1a1a1a]">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-gray-800">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="hidden">
            Create a new post to share with your friends
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pb-2">
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              className="min-h-[150px] resize-none border-none focus-visible:ring-0 px-0 text-lg shadow-none bg-transparent"
            />

            {previewUrls.length > 0 && (
              <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
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
              className="gap-2 text-slate-600 dark:text-gray-300"
              onClick={handleClickUpload}
              disabled={!canAddMore}
            >
              <ImagePlus className="w-4 h-4" />
              Thêm ảnh
            </Button>
            <span className="text-xs text-slate-500">
              {totalImages}/{maxImages} ảnh
            </span>
          </div>
        </div>

        <Separator className="my-2" />

        <DialogFooter className="px-6 py-4 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="min-w-[100px]">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang đăng...
              </>
            ) : (
              'Đăng bài'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
