import { useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useImageUpload } from "./useImageUpload";
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

export function useCreatePost(options: UseCreatePostOptions) {
  const {
    defaultContent = "",
    defaultBookId = "",
    defaultBookTitle = "",
    maxImages = 10,
    onSubmit: externalOnSubmit,
  } = options;

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: defaultContent,
      bookId: defaultBookId,
      bookTitle: defaultBookTitle,
      images: [],
    },
  });

  const { reset } = form;
  const currentImages = useWatch({ control: form.control, name: "images" }) ?? [];

  useEffect(() => {
    reset({
      content: defaultContent,
      bookId: defaultBookId,
      bookTitle: defaultBookTitle,
      images: [],
    });
  }, [defaultContent, defaultBookId, defaultBookTitle, reset]);

  const imageUpload = useImageUpload({
    maxImages,
    currentImages,
    onChange: (images) => form.setValue("images", images),
  });

  const onSubmit = useCallback(
    async (values: CreatePostFormValues) => {
      try {
        await externalOnSubmit(values);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [externalOnSubmit],
  );

  return {
    form,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
    ...imageUpload,
  };
}
