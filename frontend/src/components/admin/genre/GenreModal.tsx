'use client';

import { useState, useEffect } from 'react';
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
import { Tag, Loader2, Save } from "lucide-react";
import { useModalStore } from "@/store/useModalStore";
import { 
    useCreateGenreMutation, 
    useUpdateGenreMutation 
} from "@/features/genres/api/genreApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function GenreModal() {
    const { isGenreModalOpen, closeGenreModal, genreModalData } = useModalStore();
    const isEdit = !!genreModalData?.genre;

    const [createGenre, { isLoading: isCreating }] = useCreateGenreMutation();
    const [updateGenre, { isLoading: isUpdating }] = useUpdateGenreMutation();
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (isGenreModalOpen && genreModalData?.genre) {
            setFormData({
                name: genreModalData.genre.name,
                description: genreModalData.genre.description || '',
            });
        } else if (isGenreModalOpen) {
            setFormData({
                name: '',
                description: '',
            });
        }
    }, [isGenreModalOpen, genreModalData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.info('Tên thể loại không được để trống!');
            return;
        }

        try {
            if (isEdit && genreModalData?.genre) {
                await updateGenre({
                    id: genreModalData.genre.id,
                    data: {
                        name: formData.name.trim(),
                        description: formData.description.trim() || undefined,
                    },
                }).unwrap();
                toast.success('Cập nhật thể loại thành công!');
            } else {
                await createGenre({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                }).unwrap();
                toast.success('Tạo thể loại thành công!');
            }

            genreModalData?.onSuccess?.();
            closeGenreModal();
        } catch (error: unknown) {
            console.error('Failed to save genre:', error);
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <Dialog open={isGenreModalOpen} onOpenChange={(open) => !open && !isLoading && closeGenreModal()}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#1a1a1a] border-slate-100 dark:border-gray-800 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-gray-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {isEdit ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1">
                                Tên thể loại <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Tiểu thuyết, Trinh thám..."
                                className="h-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                                required
                                maxLength={100}
                                disabled={isLoading}
                            />
                            <div className="flex justify-end">
                                <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                                    {formData.name.length}/100
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold">
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả ngắn về thể loại này..."
                                className="min-h-[120px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 resize-none"
                                maxLength={500}
                                disabled={isLoading}
                            />
                            <div className="flex justify-end">
                                <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                                    {formData.description.length}/500
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100 dark:border-gray-800 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeGenreModal}
                            disabled={isLoading}
                            className="font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 h-11 px-6"
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
                            {isEdit ? 'Cập nhật' : 'Tạo thể loại'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
