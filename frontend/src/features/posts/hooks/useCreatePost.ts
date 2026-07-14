import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export const createPostSchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung bài viết"),
  images: z.array(z.instanceof(File)).max(10, "Chỉ có thể thêm tối đa 10 ảnh"),
  bookId: z.string().min(1, "Vui lòng chọn một cuốn sách"),
  bookTitle: z.string().optional(),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

interface UseCreatePostOptions {
  defaultContent?: string;
  defaultBookId?: string;
  defaultBookTitle?: string;
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
  onSubmit: (values: CreatePostFormValues) => Promise<void>;
}

export function useCreatePost(
  options: UseCreatePostOptions,
): UseCreatePostReturn {
  const {
    defaultContent = "",
    defaultBookId = "",
    defaultBookTitle = "",
    maxImages = 10,
    onSubmit: externalOnSubmit,
  } = options;

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: defaultContent,
      bookId: defaultBookId,
      bookTitle: defaultBookTitle,
      images: [],
    },
  });

  const { watch, setValue, reset, getValues } = form;
  const currentImages = watch("images") || [];
  const totalImages = currentImages.length;
  const canAddMore = totalImages < maxImages;

  useEffect(() => {
    reset({
      content: defaultContent,
      bookId: defaultBookId,
      bookTitle: defaultBookTitle,
      images: [],
    });
    setPreviewUrls([]);
  }, [defaultContent, defaultBookId, defaultBookTitle, reset]);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const filesArray = Array.from(files);
      const currentImagesVal = getValues("images") || [];
      const totalImagesVal = currentImagesVal.length + filesArray.length;

      if (totalImagesVal > maxImages) {
        toast.error(`Chỉ có thể thêm tối đa ${maxImages} ảnh`);
        return;
      }

      const validFiles = filesArray.filter((file) => {
        const isValid = file.type.startsWith("image/");
        if (!isValid) {
          toast.error(`File ${file.name} không phải là hình ảnh`);
        }
        return isValid;
      });

      if (validFiles.length > 0) {
        const updatedImages = [...currentImagesVal, ...validFiles];
        setValue("images", updatedImages);
        const newPreviewUrls = validFiles.map((file) =>
          URL.createObjectURL(file),
        );
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      }
    },
    [maxImages, setValue, getValues],
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const currentImagesVal = getValues("images") || [];
      URL.revokeObjectURL(previewUrls[index]);
      const updatedImages = currentImagesVal.filter((_, i) => i !== index);
      const updatedPreviews = previewUrls.filter((_, i) => i !== index);
      setValue("images", updatedImages);
      setPreviewUrls(updatedPreviews);
    },
    [previewUrls, setValue, getValues],
  );

  const onSubmit = useCallback(
    async (values: CreatePostFormValues) => {
      setIsSubmitting(true);
      try {
        await externalOnSubmit(values);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [externalOnSubmit],
  );

  return {
    form,
    previewUrls,
    isSubmitting,
    handleFileSelect,
    handleRemoveImage,
    canAddMore,
    totalImages,
    onSubmit,
  };
}
