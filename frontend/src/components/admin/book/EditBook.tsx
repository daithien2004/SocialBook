'use client';

import { ChangeEvent, FormEvent, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Upload,
    Plus,
    X,
    Loader2,
    BookOpen,
    Calendar,
    Tag,
    FileText,
    ChevronDown,
    Save,
} from 'lucide-react';
import { useUpdateBookMutation, useGetBookByIdQuery } from '@/src/features/books/api/bookApi';
import { useGetAuthorsQuery, useGetGenresQuery } from '@/src/features/admin/api/bookRelationApi';

const DEFAULT_COVER = '/abstract-book-pattern.png';

type Status = 'draft' | 'published' | 'completed';

interface FormData {
    title: string;
    authorId: string;
    genres: string[];
    description: string;
    publishedYear: string;
    status: Status;
    tagsInput: string;
}

interface EditBookProps {
    bookId: string;
}

export default function EditBook({ bookId }: EditBookProps) {
    const router = useRouter();

    // Fetch existing book data
    const { data: bookData, isLoading: loadingBook, error: bookError } = useGetBookByIdQuery(bookId);
    const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();
    const { data: authors = [], isLoading: loadingAuthors } = useGetAuthorsQuery();
    const { data: genres = [], isLoading: loadingGenres } = useGetGenresQuery();

    const [formData, setFormData] = useState<FormData>({
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
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // Populate form when book data loads
    useEffect(() => {
        if (bookData) {
            setFormData({
                title: bookData.title || '',
                authorId: bookData.authorId?.id || '',
                genres: bookData.genres?.map((g: any) => g.id) || [],
                description: bookData.description || '',
                publishedYear: bookData.publishedYear || new Date().getFullYear().toString(),
                status: bookData.status || 'draft',
                tagsInput: bookData.tags?.join(', ') || '',
            });

            if (bookData.coverUrl) {
                setCoverPreview(bookData.coverUrl);
            }
        }
    }, [bookData]);

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

    const handleAddGenre = () => {
        if (!selectedGenreId) return;
        if (formData.genres.includes(selectedGenreId)) {
            setSelectedGenreId('');
            return;
        }
        setFormData((prev) => ({ ...prev, genres: [...prev.genres, selectedGenreId] }));
        setSelectedGenreId('');
    };

    const handleRemoveGenre = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            genres: prev.genres.filter((g) => g !== id),
        }));
    };

    const getGenreName = (genreId: string) => {
        const genre = genres.find((g: any) => g.id === genreId);
        return genre?.name || genreId;
    };

    const getAuthorName = (authorId: string) => {
        const author = authors.find((a: any) => a.id === authorId);
        return author?.name || 'Chưa chọn';
    };

    const handleSubmit = async (e: FormEvent) => {
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

            await updateBook({ bookId, formData: formPayload }).unwrap();

            setMessage({
                type: 'success',
                text: 'Cập nhật sách thành công! Đang chuyển hướng...',
            });

            setTimeout(() => {
                router.push('/admin/books');
            }, 1500);

        } catch (err: any) {
            let errorMsg = 'Không thể cập nhật sách. Vui lòng kiểm tra lại thông tin.';

            if (err?.data?.message) {
                if (Array.isArray(err.data.message)) {
                    errorMsg = err.data.message.join(', ');
                } else {
                    errorMsg = err.data.message;
                }
            }

            setMessage({ type: 'error', text: errorMsg });
        }
    };

    if (loadingBook) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (bookError || !bookData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sách</h2>
                    <button
                        onClick={() => router.push('/admin/books')}
                        className="text-blue-600 hover:underline"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/admin/books')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Quay lại danh sách sách
                    </button>

                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Chỉnh sửa sách
                    </h1>
                    <p className="text-lg text-gray-600">
                        Cập nhật thông tin cho "{bookData.title}"
                    </p>
                </div>

                {message && (
                    <div
                        className={`mb-6 p-4 rounded-xl border shadow-sm ${message.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                    >
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Book Cover Section */}
                            <div className="flex-none">
                                <div className="w-64 h-96 relative rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 group">
                                    <img
                                        src={coverPreview}
                                        alt="Bìa sách"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Upload size={32} className="mx-auto mb-2" />
                                            <p className="text-sm font-medium">Thay đổi ảnh bìa</p>
                                        </div>
                                    </div>
                                </div>

                                <label className="block mt-4">
                                    <div className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                        <Upload size={20} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Tải ảnh bìa mới
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            JPG, PNG, WebP • &lt; 5MB
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>

                                {coverFile && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-800 font-medium truncate">
                                            📎 {coverFile.name}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {(coverFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Book Info Form - Same as CreateBook */}
                            <div className="flex-1 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        <BookOpen className="inline w-4 h-4 mr-1" />
                                        Tiêu đề sách *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        placeholder="Nhập tiêu đề sách..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        required
                                    />
                                </div>

                                {/* Author and Published Year */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Tác giả *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.authorId}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        authorId: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                                                required
                                                disabled={loadingAuthors}
                                            >
                                                <option value="">
                                                    {loadingAuthors ? 'Đang tải...' : 'Chọn tác giả'}
                                                </option>
                                                {authors.map((author: any) => (
                                                    <option key={author.id} value={author.id}>
                                                        {author.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={20}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            <Calendar className="inline w-4 h-4 mr-1" />
                                            Năm xuất bản
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.publishedYear}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    publishedYear: e.target.value,
                                                }))
                                            }
                                            placeholder={new Date().getFullYear().toString()}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        <FileText className="inline w-4 h-4 mr-1" />
                                        Mô tả sách
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Giới thiệu ngắn gọn về nội dung sách..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Trạng thái
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: e.target.value as Status,
                                                }))
                                            }
                                            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                                        >
                                            <option value="draft">Bản nháp</option>
                                            <option value="published">Đang xuất bản</option>
                                            <option value="completed">Hoàn thành</option>
                                        </select>
                                        <ChevronDown
                                            size={20}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information Grid - Same as CreateBook */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Genres Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Thể loại & Tags
                                </h2>

                                {/* Genre Dropdown */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Thể loại *
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <select
                                                value={selectedGenreId}
                                                onChange={(e) => setSelectedGenreId(e.target.value)}
                                                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                                                disabled={loadingGenres}
                                            >
                                                <option value="">
                                                    {loadingGenres ? 'Đang tải...' : 'Chọn thể loại'}
                                                </option>
                                                {genres.map((genre: any) => (
                                                    <option
                                                        key={genre.id}
                                                        value={genre.id}
                                                        disabled={formData.genres.includes(genre.id)}
                                                    >
                                                        {genre.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={20}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddGenre}
                                            disabled={!selectedGenreId}
                                            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={18} />
                                            Thêm
                                        </button>
                                    </div>

                                    {formData.genres.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {formData.genres.map((genreId) => (
                                                <span
                                                    key={genreId}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                                >
                                                    {getGenreName(genreId)}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGenre(genreId)}
                                                        className="hover:text-blue-900 transition"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tags Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        <Tag className="inline w-4 h-4 mr-1" />
                                        Tags (ngăn cách bằng dấu phẩy)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tagsInput}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                tagsInput: e.target.value,
                                            }))
                                        }
                                        placeholder="fantasy, romance, adventure..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Nhập các tag cách nhau bằng dấu phẩy để dễ tìm kiếm
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Tóm tắt</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tác giả:</span>
                                        <span className="font-semibold text-gray-900 text-right ml-2 truncate max-w-[150px]">
                                            {getAuthorName(formData.authorId)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formData.status === 'draft' && 'Bản nháp'}
                                            {formData.status === 'published' && 'Đang xuất bản'}
                                            {formData.status === 'completed' && 'Hoàn thành'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Thể loại:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formData.genres.length} thể loại
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tags:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formData.tagsInput
                                                ? formData.tagsInput.split(',').length
                                                : 0}{' '}
                                            tags
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Năm xuất bản:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formData.publishedYear || 'Chưa có'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Đang cập nhật...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin/books')}
                                        className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
