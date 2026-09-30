import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseImageUploadOptions {
  maxImages: number;
  currentImages: File[];
  onChange: (images: File[]) => void;
}

interface UseImageUploadReturn {
  previewUrls: string[];
  handleFileSelect: (files: FileList | null) => void;
  handleRemoveImage: (index: number) => void;
  canAddMore: boolean;
  totalImages: number;
}

export function useImageUpload({
  maxImages,
  currentImages,
  onChange,
}: UseImageUploadOptions): UseImageUploadReturn {
  const totalImages = currentImages.length;
  const canAddMore = totalImages < maxImages;

  const [urlMap, setUrlMap] = useState<Map<File, string>>(() => new Map());
  const previewUrls = currentImages
    .map((file) => urlMap.get(file))
    .filter((url): url is string => !!url);

  const urlMapRef = useRef(urlMap);
  useEffect(() => {
    urlMapRef.current = urlMap;
  }, [urlMap]);

  useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const filesArray = Array.from(files);
      const totalImagesVal = currentImages.length + filesArray.length;

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
        setUrlMap((prev) => {
          const next = new Map(prev);
          for (const file of validFiles) {
            next.set(file, URL.createObjectURL(file));
          }
          return next;
        });
        onChange([...currentImages, ...validFiles]);
      }
    },
    [maxImages, currentImages, onChange],
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const removed = currentImages[index];

      if (removed) {
        const url = urlMapRef.current.get(removed);
        if (url) {
          URL.revokeObjectURL(url);
          setUrlMap((prev) => {
            const next = new Map(prev);
            next.delete(removed);
            return next;
          });
        }
      }

      onChange(currentImages.filter((_, i) => i !== index));
    },
    [currentImages, onChange],
  );

  return {
    previewUrls,
    handleFileSelect,
    handleRemoveImage,
    canAddMore,
    totalImages,
  };
}
