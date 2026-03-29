'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Loader2, Save, Upload, X } from "lucide-react";
import Image from 'next/image';
import { useModalStore } from "@/store/useModalStore";
import { 
    useCreateAuthorMutation, 
    useUpdateAuthorMutation 
} from "@/features/authors/api/authorApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

const DEFAULT_AVATAR = '/default-avatar.png';

export default function AuthorModal() {
    const { isAuthorModalOpen, closeAuthorModal, authorModalData } = useModalStore();
    const isEdit = !!authorModalData?.author;

    const [createAuthor, { isLoading: isCreating }] = useCreateAuthorMutation();
    const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string>(DEFAULT_AVATAR);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        if (isAuthorModalOpen && authorModalData?.author) {
            setFormData({
                name: authorModalData.author.name,
                bio: authorModalData.author.bio || '',
            });
            setPhotoPreview(authorModalData.author.photoUrl || DEFAULT_AVATAR);
            setPhotoFile(null);
        } else if (isAuthorModalOpen) {
            setFormData({
                name: '',
                bio: '',
            });
            setPhotoPreview(DEFAULT_AVATAR);
            setPhotoFile(null);
        }
    }, [isAuthorModalOpen, authorModalData]);

    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }

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
            formPayload.append('bio', formData.bio.trim());

            if (photoFile) {
                formPayload.append('photoUrl', photoFile);
            }

            if (isEdit && authorModalData?.author) {
                await updateAuthor({
                    id: authorModalData.author.id,
                    data: formPayload,
                }).unwrap();
                toast.success('Cập nhật tác giả thành công!');
            } else {
                await createAuthor(formPayload).unwrap();
                toast.success('Tạo tác giả thành công!');
            }

            authorModalData?.onSuccess?.();
            closeAuthorModal();
        } catch (error: unknown) {
            console.error('Failed to save author:', error);
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <Dialog open={isAuthorModalOpen} onOpenChange={(open) => !open && !isLoading && closeAuthorModal()}>
            <DialogContent className="sm:max-w-[650px] bg-white dark:bg-[#1a1a1a] border-slate-100 dark:border-gray-800 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-gray-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {isEdit ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Left: Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-50 dark:border-white/5 shadow-xl relative ring-1 ring-slate-200 dark:ring-white/10 transition-all group-hover:ring-blue-500">
                                    <Image
                                        src={photoPreview}
                                        alt="Avatar preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="w-8 h-8 text-white mb-1" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Thay đổi ảnh</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                {photoFile && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 w-7 h-7 rounded-full shadow-lg"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setPhotoPreview(authorModalData?.author?.photoUrl || DEFAULT_AVATAR);
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dung lượng tối đa</p>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">5MB (JPG, PNG)</p>
                            </div>
                        </div>

                        {/* Right: Form Bio */}
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="author-name" className="text-sm font-semibold flex items-center gap-1">
                                    Tên tác giả <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="author-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nguyễn Nhật Ánh..."
                                    className="h-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="author-bio" className="text-sm font-semibold">
                                    Tiểu sử
                                </Label>
                                <Textarea
                                    id="author-bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Mô tả về tác giả..."
                                    className="min-h-[150px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 resize-none py-3"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 mt-6 border-t border-slate-100 dark:border-gray-800 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeAuthorModal}
                            disabled={isLoading}
                            className="font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 h-11 px-6 transition-all"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {isEdit ? 'Cập nhật' : 'Tạo tác giả'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
