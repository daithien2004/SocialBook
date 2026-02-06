'use client';

import { useState, useEffect, use, useCallback, ChangeEvent } from 'react';
import { useGetAuthorQuery, useUpdateAuthorMutation } from '@/src/features/authors/api/authorApi';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getErrorMessage } from '@/src/lib/utils';

const DEFAULT_AVATAR = '/default-avatar.png';

interface EditAuthorPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditAuthorPage({ params }: EditAuthorPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const { data: authorData, isLoading: isLoadingAuthor, error, isError } = useGetAuthorQuery(id, {
        refetchOnMountOrArgChange: true, // Force refresh
    });
    const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string>(DEFAULT_AVATAR);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {

        if (authorData) {
            setFormData({
                name: authorData.name || '',
                bio: authorData.bio || '',
            });
            if (authorData.photoUrl) {
                setPhotoPreview(authorData.photoUrl);
            }
        }
    }, [authorData, isLoadingAuthor, id]);
    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        setPhotoFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            setPhotoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.info('Tên tác giả không được để trống!');
            return;
        }

        try {
            const formPayload = new FormData();
            formPayload.append('name', formData.name.trim());
            formPayload.append('bio', formData.bio.trim() || '');

            if (photoFile) {
                formPayload.append('photoUrl', photoFile);
            }

            await updateAuthor({
                id,
                data: formPayload,
            }).unwrap();

            toast.success('Cập nhật tác giả thành công!');
            router.push('/admin/authors');
        } catch (error: any) {
            console.error('Failed to update author:', error);
            toast.error(getErrorMessage(error));
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
            <div className="py-6">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Photo Section */}
                            <div className="flex-none">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Ảnh đại diện
                                </label>
                                <div className="w-48 h-48 relative rounded-full overflow-hidden shadow-lg border-4 border-gray-200 group">
                                    <img
                                        src={photoPreview}
                                        alt="Author photo"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Upload size={28} className="mx-auto mb-1" />
                                            <p className="text-xs font-medium">Thay đổi ảnh</p>
                                        </div>
                                    </div>
                                </div>

                                <label className="block mt-4">
                                    <div className="flex flex-col items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                        <Upload size={18} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Tải ảnh lên
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            JPG, PNG • &lt; 5MB
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>

                                {photoFile && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-800 font-medium truncate">
                                            📎 {photoFile.name}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {(photoFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <User className="inline w-4 h-4 mr-1" />
                                        Tên tác giả <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nguyễn Nhật Ánh"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
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
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>
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
