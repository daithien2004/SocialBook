'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore } from '@/store/useModalStore';
import { useUpdateCollectionMutation } from '@/features/library/api/libraryApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditCollectionModal() {
  const { isEditCollectionOpen, closeEditCollection, editCollectionData } = useModalStore();
  const [name, setName] = useState(editCollectionData?.currentName || '');
  const [lastSnapshot, setLastSnapshot] = useState(editCollectionData);
  const [updateCollection, { isLoading }] = useUpdateCollectionMutation();

  if (editCollectionData !== lastSnapshot) {
    setLastSnapshot(editCollectionData);
    if (editCollectionData?.currentName) {
      setName(editCollectionData.currentName);
    }
  }

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
    } catch {
      toast.error('Lỗi khi cập nhật tên bộ sưu tập');
    }
  };

  return (
    <Dialog open={isEditCollectionOpen} onOpenChange={(open) => !open && closeEditCollection()}>
      <DialogContent className="sm:max-w-[400px] bg-card p-0 gap-0 border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Đổi tên bộ sưu tập</DialogTitle>
          <DialogDescription>Đổi tên bộ sưu tập sách</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Đổi tên bộ sưu tập</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex gap-2">
          <Input
            autoFocus
            placeholder="Tên bộ sưu tập..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !name.trim() || name === editCollectionData?.currentName}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
