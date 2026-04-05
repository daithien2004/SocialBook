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
import { useModalStore } from '@/store/useModalStore';
import { useUpdateCollectionMutation } from '@/features/library/api/libraryApi';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';

export default function EditCollectionModal() {
  const { isEditCollectionOpen, closeEditCollection, editCollectionData } = useModalStore();
  const [name, setName] = useState('');
  const [updateCollection, { isLoading }] = useUpdateCollectionMutation();

  useEffect(() => {
    if (editCollectionData?.currentName) {
      setName(editCollectionData.currentName);
    }
  }, [editCollectionData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editCollectionData) return;

    try {
      await updateCollection({
        id: editCollectionData.collectionId,
        data: { name: name.trim() },
      }).unwrap();
      
      toast.success('Đã cập nhật tên bộ sưu tập');
      editCollectionData.onSuccess?.();
      closeEditCollection();
    } catch (error: any) {
      toast.error('Lỗi khi cập nhật tên bộ sưu tập');
    }
  };

  return (
    <Dialog open={isEditCollectionOpen} onOpenChange={closeEditCollection}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-amber-500 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Đổi tên</DialogTitle>
              <p className="text-amber-50/80 text-sm mt-0.5">Cập nhật tên cho bộ sưu tập của bạn</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-collection-name" className="text-sm font-semibold text-gray-700 ml-1">
              Tên bộ sưu tập mới
            </Label>
            <Input
              id="edit-collection-name"
              autoFocus
              placeholder="Nhập tên mới..."
              className="rounded-xl border-gray-200 focus:ring-amber-500/20 focus:border-amber-500 h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeEditCollection}
              disabled={isLoading}
              className="rounded-xl font-semibold hover:bg-gray-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || name === editCollectionData?.currentName}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 font-bold px-8 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
