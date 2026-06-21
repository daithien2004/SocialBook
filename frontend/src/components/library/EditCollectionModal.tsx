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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Lock, Globe } from 'lucide-react';

export default function EditCollectionModal() {
  const { isEditCollectionOpen, closeEditCollection, editCollectionData } = useModalStore();
  const [name, setName] = useState(editCollectionData?.currentName || '');
  const [isPublic, setIsPublic] = useState(editCollectionData?.currentIsPublic ?? false);
  const [lastSnapshot, setLastSnapshot] = useState(editCollectionData);
  const [updateCollection, { isLoading }] = useUpdateCollectionMutation();

  if (editCollectionData !== lastSnapshot) {
    setLastSnapshot(editCollectionData);
    if (editCollectionData) {
      setName(editCollectionData.currentName);
      setIsPublic(editCollectionData.currentIsPublic);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editCollectionData) return;

    try {
      await updateCollection({
        id: editCollectionData.collectionId,
        data: { name: name.trim(), isPublic },
      }).unwrap();

      toast.success('Đã cập nhật bộ sưu tập');
      editCollectionData.onSuccess?.();
      closeEditCollection();
    } catch {
      toast.error('Lỗi khi cập nhật bộ sưu tập');
    }
  };

  return (
    <Dialog open={isEditCollectionOpen} onOpenChange={(open) => !open && closeEditCollection()}>
      <DialogContent className="sm:max-w-[420px] bg-card p-0 gap-0 border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Chỉnh sửa bộ sưu tập</DialogTitle>
          <DialogDescription>Chỉnh sửa tên và quyền riêng tư của bộ sưu tập</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Chỉnh sửa bộ sưu tập</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Tên bộ sưu tập</label>
            <Input
              autoFocus
              placeholder="Nhập tên bộ sưu tập..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Chế độ hiển thị</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={cn(
                  "flex-1 p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer",
                  !isPublic
                    ? "border-brand bg-brand/10 ring-1 ring-brand"
                    : "border-border bg-card hover:bg-muted/10"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Lock size={14} className={!isPublic ? "text-brand" : "text-muted-foreground"} />
                  <span className={!isPublic ? "text-brand" : "text-foreground"}>Chỉ mình tôi</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">Chỉ bạn mới nhìn thấy bộ sưu tập này.</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={cn(
                  "flex-1 p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer",
                  isPublic
                    ? "border-brand bg-brand/10 ring-1 ring-brand"
                    : "border-border bg-card hover:bg-muted/10"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Globe size={14} className={isPublic ? "text-brand" : "text-muted-foreground"} />
                  <span className={isPublic ? "text-brand" : "text-foreground"}>Công khai</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">Bất kỳ ai cũng có thể xem bộ sưu tập này.</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditCollection}
              disabled={isLoading}
              className="h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="h-10 px-5 font-semibold"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
