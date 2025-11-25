'use client';

import { useState, useEffect, use } from 'react';
import { useGetAuthorQuery, useUpdateAuthorMutation } from '@/src/features/authors/api/authorApi';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EditAuthorPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditAuthorPage({ params }: EditAuthorPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const { data: authorData, isLoading: isLoadingAuthor } = useGetAuthorQuery(id);
    const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        photoUrl: '',
    });

    useEffect(() => {
        if (authorData) {
            setFormData({
                name: authorData.name || '',
                bio: authorData.bio || '',
                photoUrl: authorData.photoUrl || '',
            });
        }
    }, [authorData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Tên tác giả không được để trống!');
            return;
        }

        try {
            await updateAuthor({
                id,
                name: formData.name.trim(),
                bio: formData.bio.trim() || undefined,
                photoUrl: formData.photoUrl.trim() || undefined,
            }).unwrap();

            alert('Cập nhật tác giả thành công!');
            router.push('/admin/authors');
        } catch (error: any) {
            console.error('Failed to update author:', error);
            alert(error?.data?.message || 'Cập nhật tác giả thất bại!');
        }
    };

    if (isLoadingAuthor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!authorData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy tác giả</h2>
                    <Link href="/admin/authors" className="text-blue-600 hover:underline">
                        Quay lại danh sách
                    </Link>
                </div>
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
                            href="/admin/authors"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa tác giả</h1>
                            <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin tác giả {authorData.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tên tác giả <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nguyễn Nhật Ánh"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Photo URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    URL ảnh đại diện
                                </label>
                                <input
                                    type="url"
                                    value={formData.photoUrl}
                                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tiểu sử
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Nhà văn nổi tiếng Việt Nam..."
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <Link
                                href="/admin/authors"
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
                                        Lưu thay đổi
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
