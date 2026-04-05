'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PostImageGalleryProps {
    images: string[];
    isOwner?: boolean;
    onDeleteImage?: (imageUrl: string) => void;
}

export function PostImageGallery({
    images,
    isOwner = false,
    onDeleteImage,
}: PostImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < images.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    }, [currentIndex, images.length]);

    const prevImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleDeleteClick = useCallback((imageUrl: string) => {
        onDeleteImage?.(imageUrl);
    }, [onDeleteImage]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full bg-slate-50 dark:bg-gray-900/30 group border-y border-slate-100 dark:border-gray-800">
            <div className="relative h-96 w-full overflow-hidden">
                <Image
                    src={images[currentIndex]}
                    alt={`Post image ${currentIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain bg-slate-100 dark:bg-black/20"
                />
            </div>

            {isOwner && onDeleteImage && (
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(images[currentIndex])}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Xóa ảnh này"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}

            {images.length > 1 && (
                <>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={prevImage}
                        disabled={currentIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
                        aria-label="Ảnh trước"
                    >
                        <span className="text-lg leading-none pb-1">‹</span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={nextImage}
                        disabled={currentIndex === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
                        aria-label="Ảnh sau"
                    >
                        <span className="text-lg leading-none pb-1">›</span>
                    </Button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-[2px]">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    'h-1.5 rounded-full transition-all shadow-sm',
                                    index === currentIndex ? 'bg-white w-6' : 'bg-white/60 w-1.5 hover:bg-white/80'
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
