'use client';

import { useState } from 'react';
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
import { useCreateCollectionMutation } from '@/features/library/api/libraryApi';
import { toast } from 'sonner';
import { Loader2, FolderPlus } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-blue-600 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Bộ sưu tập mới</DialogTitle>
              <p className="text-blue-100/80 text-sm mt-0.5">Tạo danh sách đọc cá nhân của bạn</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="collection-name" className="text-sm font-semibold text-gray-700 ml-1">
              Tên bộ sưu tập
            </Label>
            <Input
              id="collection-name"
              autoFocus
              placeholder="Ví dụ: Truyện hay tháng 10..."
              className="rounded-xl border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeCreateCollection}
              disabled={isLoading}
              className="rounded-xl font-semibold hover:bg-gray-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
