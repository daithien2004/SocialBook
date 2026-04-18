import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/utils';

const DEFAULT_COVER = '/abstract-book-pattern.png';

export type BookStatus = 'draft' | 'published' | 'completed';

export interface CreateBookFormData {
    title: string;
    authorId: string;
    genres: string[];
    description: string;
    publishedYear: string;
    status: BookStatus;
    tagsInput: string;
}

export interface UseCreateBookFormResult {
    formData: CreateBookFormData;
    coverPreview: string;
    coverFile: File | null;
    selectedGenreId: string;
    message: { type: 'success' | 'error'; text: string } | null;
    isSubmitting: boolean;
    setFormData: React.Dispatch<React.SetStateAction<CreateBookFormData>>;
    setSelectedGenreId: React.Dispatch<React.SetStateAction<string>>;
    handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    handleAddGenre: () => void;
    handleRemoveGenre: (genreId: string) => void;
    handleReset: () => void;
    handleSubmit: (e: FormEvent) => Promise<void>;
}

export function useCreateBookForm(
    createBook: (payload: FormData) => Promise<unknown>
): UseCreateBookFormResult {
    const router = useRouter();

    const [formData, setFormData] = useState<CreateBookFormData>({
        title: '',
        authorId: '',
        genres: [],
        description: '',
        publishedYear: new Date().getFullYear().toString(),
        status: 'draft',
        tagsInput: '',
    });

    const [coverPreview, setCoverPreview] = useState<string>(DEFAULT_COVER);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [selectedGenreId, setSelectedGenreId] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCoverFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleAddGenre = useCallback(() => {
        if (!selectedGenreId) return;
        if (formData.genres.includes(selectedGenreId)) {
            setSelectedGenreId('');
            return;
        }
        setFormData((prev) => ({ ...prev, genres: [...prev.genres, selectedGenreId] }));
        setSelectedGenreId('');
    }, [selectedGenreId, formData.genres]);

    const handleRemoveGenre = useCallback((genreId: string) => {
        setFormData((prev) => ({
            ...prev,
            genres: prev.genres.filter((g) => g !== genreId),
        }));
    }, []);

    const handleReset = useCallback(() => {
        setFormData({
            title: '',
            authorId: '',
            genres: [],
            description: '',
            publishedYear: new Date().getFullYear().toString(),
            status: 'draft',
            tagsInput: '',
        });
        setCoverPreview(DEFAULT_COVER);
        setCoverFile(null);
        setSelectedGenreId('');
        setMessage(null);
    }, []);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!formData.title.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tiêu đề sách' });
            return;
        }

        if (!formData.authorId.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng chọn tác giả' });
            return;
        }

        if (formData.genres.length === 0) {
            setMessage({ type: 'error', text: 'Vui lòng chọn ít nhất 1 thể loại' });
            return;
        }

        try {
            setIsSubmitting(true);

            const tags = formData.tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

            const formPayload = new FormData();

            formPayload.append('title', formData.title.trim());
            formPayload.append('authorId', formData.authorId.trim());
            formPayload.append('description', formData.description.trim());
            formPayload.append('status', formData.status);
            formPayload.append('publishedYear', formData.publishedYear);

            formData.genres.forEach((genreId) => {
                formPayload.append('genres', genreId);
            });

            tags.forEach((tag) => {
                formPayload.append('tags', tag);
            });

            if (coverFile) {
                formPayload.append('coverUrl', coverFile);
            }

            await createBook(formPayload);

            setMessage({
                type: 'success',
                text: 'Tạo sách thành công! Đang chuyển hướng...',
            });

            handleReset();

            setTimeout(() => {
                router.push('/admin/books');
            }, 1500);

        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, coverFile, handleReset, router, createBook]);

    return {
        formData,
        coverPreview,
        coverFile,
        selectedGenreId,
        message,
        isSubmitting,
        setFormData,
        setSelectedGenreId,
        handleImageUpload,
        handleAddGenre,
        handleRemoveGenre,
        handleReset,
        handleSubmit,
    };
}
