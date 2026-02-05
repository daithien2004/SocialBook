'use client';

import { useState, useEffect } from 'react';
import { useGetGenreQuery, useUpdateGenreMutation } from '@/src/features/genres/api/genreApi';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getErrorMessage } from '@/src/lib/utils';

export default function EditGenrePage() {
    const router = useRouter();
    const params = useParams();
    const genreId = params.id as string;

    const { data: genre, isLoading: isLoadingGenre } = useGetGenreQuery(genreId);
    const [updateGenre, { isLoading: isUpdating }] = useUpdateGenreMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (genre) {
            setFormData({
                name: genre.name || '',
                description: genre.description || '',
            });
        }
    }, [genre]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.info('Tên thể loại không được để trống!');
            return;
        }

        try {
            await updateGenre({
                id: genreId,
                data: {
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                },
            }).unwrap();

            toast.success('Cập nhật thể loại thành công!');
            router.push('/admin/genres');
        } catch (error: any) {
            console.error('Failed to update genre:', error);
            toast.error(getErrorMessage(error));
        }
    };

    if (isLoadingGenre) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!genre) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thể loại</h1>
                <Link href="/admin/genres" className="text-blue-600 hover:text-blue-700">
                    ← Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/genres"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa thể loại</h1>
                            <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin thể loại</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="py-6">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Tag className="inline w-4 h-4 mr-1" />
                                    Tên thể loại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Tiểu thuyết, Trinh thám, Khoa học viễn tưởng..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                    maxLength={100}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.name.length}/100 ký tự
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả ngắn về thể loại này..."
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.description.length}/500 ký tự
                                </p>
                            </div>

                            {/* Slug Display */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Slug (tự động)
                                </label>
                                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                                    <code className="text-sm text-gray-700">{genre.slug}</code>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Slug sẽ được tự động cập nhật khi bạn thay đổi tên thể loại
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <Link
                                href="/admin/genres"
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Cập nhật
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
