'use client';

import {useState, useRef} from 'react';
import {Post} from '@/src/features/posts/types/post.interface';
import {useUpdatePostMutation} from '@/src/features/posts/api/postApi';
import {X, Image as ImageIcon, Loader2} from 'lucide-react';
import BookSelector from './BookSelector';
import {toast} from "sonner";

interface EditPostFormProps {
    post: Post;
    onClose: () => void;
}

export default function EditPostForm({post, onClose}: EditPostFormProps) {
    const [content, setContent] = useState(post.content);
    const [bookId, setBookId] = useState(post.bookId?.id || '');
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [updatePost, {isLoading}] = useUpdatePostMutation();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalImages =
            (post.imageUrls?.length || 0) + newImages.length + files.length;

        if (totalImages > 10) {
            alert('Tổng số ảnh không được vượt quá 10');
            return;
        }

        setNewImages((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            alert('Vui lòng nhập nội dung bài viết');
            return;
        }

        try {
            await updatePost({
                id: post.id,
                data: {
                    content,
                    bookId: bookId || undefined,
                    images: newImages.length > 0 ? newImages : undefined,
                },
            }).unwrap();

            toast.success('Cập nhật bài viết thành công! 🎉');
            onClose();
        } catch (error: any) {
            console.error('Failed to update post:', error);
            alert(error?.data?.message || 'Lỗi khi cập nhật bài viết');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/15 dark:bg-slate-900/40 backdrop-blur-[2px]"/>

            {/* Modal */}
            <div
                className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-gray-700">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-3 border-b rounded-3xl border-slate-100 dark:border-gray-800 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur sticky top-0 z-10">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-gray-100">
                        Chỉnh sửa bài viết
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4 text-slate-500 dark:text-gray-400"/>
                    </button>
                </div>

                {/* Body scroll */}
                <div className="flex-1 overflow-y-auto thin-scrollbar">
                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        {/* User info */}
                        <div className="flex items-center gap-3">
                            <img
                                src={post.userId?.image || '/abstract-book-pattern.png'}
                                alt={post.userId?.username}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                            />
                            <div className="space-y-0.5">
                                <p className="font-semibold text-sm text-slate-900 dark:text-gray-100">
                                    {post.userId?.username}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                    Chia sẻ công khai
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Chia sẻ cảm nhận của bạn về một cuốn sách..."
                            className="w-full rounded-2xl bg-slate-50 dark:bg-gray-900/40 border border-slate-200 dark:border-gray-700 px-3.5 py-3 text-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none min-h-[140px]"
                            rows={6}
                            disabled={isLoading}
                        />

                        {/* Book selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">
                                Chọn sách
                            </label>
                            <BookSelector
                                value={bookId}
                                onChange={(id) => setBookId(id)}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Existing images */}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                    Ảnh hiện tại ({post.imageUrls.length})
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {post.imageUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            className="relative rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700"
                                        >
                                            <img
                                                src={url}
                                                alt={`Existing ${index + 1}`}
                                                className="w-full h-28 md:h-32 object-cover"
                                            />
                                            <span
                                                className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-slate-900/70 text-white">
                        Đã có
                      </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                    Muốn xóa ảnh cũ, hãy thao tác tại bài viết
                                </p>
                            </div>
                        )}

                        {/* New image previews */}
                        {newImagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {newImagePreviews.map((preview, index) => (
                                    <div
                                        key={index}
                                        className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700"
                                    >
                                        <img
                                            src={preview}
                                            alt={`New ${index + 1}`}
                                            className="w-full h-28 md:h-32 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                            disabled={isLoading}
                                        >
                                            <X className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div
                            className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                disabled={isLoading}
                            >
                <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
                  <ImageIcon className="w-4 h-4"/>
                </span>
                                <span>Thêm ảnh mới</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || !content.trim()}
                                className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                                <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </form>
                </div>
            </div>
        </div>
    );
}
