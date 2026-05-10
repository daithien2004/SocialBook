'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore } from '@/store/useModalStore';
import { useUpdateCollectionMutation } from '@/features/library/api/libraryApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[350px] rounded-xl p-5 bg-card border-border shadow-lg">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base font-semibold text-foreground">Đổi tên bộ sưu tập</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            autoFocus
            placeholder="Nhập tên mới..."
            className="flex-1 rounded-lg border-input focus-visible:ring-1 focus-visible:ring-primary h-9 bg-background text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !name.trim() || name === editCollectionData?.currentName}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm font-medium shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
