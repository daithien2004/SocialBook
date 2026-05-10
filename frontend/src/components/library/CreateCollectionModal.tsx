'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore } from '@/store/useModalStore';
import { useCreateCollectionMutation } from '@/features/library/api/libraryApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateCollectionModal() {
  const { isCreateCollectionOpen, closeCreateCollection, createCollectionData } = useModalStore();
  const [name, setName] = useState('');
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCollection({
        name: name.trim(),
        isPublic: false,
      }).unwrap();
      
      toast.success('Đã tạo bộ sưu tập mới');
      setName('');
      createCollectionData?.onSuccess?.();
      closeCreateCollection();
    } catch (error: any) {
      if (error?.status !== 401) {
        toast.error('Không thể tạo bộ sưu tập. Vui lòng thử lại.');
      }
    }
  };

  return (
    <Dialog open={isCreateCollectionOpen} onOpenChange={closeCreateCollection}>
      <DialogContent className="sm:max-w-[350px] rounded-xl p-5 bg-card border-border shadow-lg">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base font-semibold text-foreground">Bộ sưu tập mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            autoFocus
            placeholder="Tên bộ sưu tập..."
            className="flex-1 rounded-lg border-input focus-visible:ring-1 focus-visible:ring-primary h-9 bg-background text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm font-medium shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
