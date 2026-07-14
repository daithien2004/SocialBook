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
import { useCreateCollectionMutation } from '@/features/library/api/libraryApi';
import { getErrorMessage, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Lock, Globe } from 'lucide-react';

export default function CreateCollectionModal() {
  const { isCreateCollectionOpen, closeCreateCollection, createCollectionData } = useModalStore();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCollection({
        name: name.trim(),
        isPublic,
      }).unwrap();
      
      toast.success('Đã tạo bộ sưu tập mới');
      setName('');
      setIsPublic(false); // Reset to default
      createCollectionData?.onSuccess?.();
      closeCreateCollection();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={isCreateCollectionOpen} onOpenChange={(open) => !open && closeCreateCollection()}>
      <DialogContent className="sm:max-w-[420px] bg-card p-0 gap-0 border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Bộ sưu tập mới</DialogTitle>
          <DialogDescription>Tạo bộ sưu tập sách mới với tùy chọn quyền riêng tư</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Bộ sưu tập mới</h2>
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
              onClick={closeCreateCollection}
              disabled={isLoading}
              className="h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="h-10 px-5 font-semibold bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tạo bộ sưu tập
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
