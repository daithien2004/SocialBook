import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Vui lòng nhập nội dung bài viết'),
  images: z.array(z.instanceof(File)).max(10, 'Chỉ có thể thêm tối đa 10 ảnh'),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

interface UseCreatePostOptions {
  defaultContent?: string;
  maxImages?: number;
  onSubmit: (values: CreatePostFormValues) => Promise<void>;
}

interface UseCreatePostReturn {
  form: ReturnType<typeof useForm<CreatePostFormValues>>;
  previewUrls: string[];
  isSubmitting: boolean;
  handleFileSelect: (files: FileList | null) => void;
  handleRemoveImage: (index: number) => void;
  canAddMore: boolean;
  totalImages: number;
}

export function useCreatePost(options: UseCreatePostOptions): UseCreatePostReturn {
  const {
    defaultContent = '',
    maxImages = 10,
    onSubmit: externalOnSubmit,
  } = options;

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    reset({
      content: defaultContent,
      images: [],
    });
    setPreviewUrls([]);
  }, [defaultContent, reset]);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
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
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      }
    },
    [currentImages, maxImages, setValue]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previewUrls[index]);
      const updatedImages = currentImages.filter((_, i) => i !== index);
      const updatedPreviews = previewUrls.filter((_, i) => i !== index);
      setValue('images', updatedImages);
      setPreviewUrls(updatedPreviews);
    },
    [currentImages, previewUrls, setValue]
  );

  const onSubmit = useCallback(
    async (values: CreatePostFormValues) => {
      setIsSubmitting(true);
      try {
        await externalOnSubmit(values);
      } catch (error) {
        console.error('Submit failed:', error);
        toast.error('Có lỗi xảy ra khi đăng bài');
      } finally {
        setIsSubmitting(false);
      }
    },
    [externalOnSubmit]
  );

  const totalImages = currentImages.length;
  const canAddMore = totalImages < maxImages;

  return {
    form,
    previewUrls,
    isSubmitting,
    handleFileSelect,
    handleRemoveImage,
    canAddMore,
    totalImages,
  };
}
