'use client';

import { useState } from 'react';
import { Crown, LogOut, User } from 'lucide-react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TransferHostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newHostId?: string) => void;
}

export function TransferHostModal({
  open,
  onOpenChange,
  onConfirm,
}: TransferHostModalProps) {
  const members = useReadingRoomStore((s) => s.members);
  const presences = useReadingRoomStore((s) => s.presences);
  const room = useReadingRoomStore((s) => s.room);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeMembers = members.filter((m) => {
    const presence = presences[m.userId];
    return m.userId !== room?.hostId && (presence || true);
  });

  const handleConfirm = () => {
    onConfirm(selectedId || undefined);
    onOpenChange(false);
    setSelectedId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown size={18} className="text-amber-500" />
            Chuyển quyền trưởng phòng
          </DialogTitle>
          <DialogDescription>
            Bạn sắp rời phòng. Chọn một người để thay bạn làm trưởng phòng, hoặc
            bỏ qua để phòng về chế độ tự do.
          </DialogDescription>
        </DialogHeader>

        {activeMembers.length > 0 && (
          <RadioGroup
            value={selectedId || ''}
            onValueChange={setSelectedId}
            className="space-y-2"
          >
            {activeMembers.map((m) => {
              const presence = presences[m.userId];
              const displayName = presence?.displayName || m.userId.slice(0, 8);
              const avatarUrl = presence?.avatarUrl;
              return (
                <Label
                  key={m.userId}
                  htmlFor={m.userId}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent transition-colors has-[[data-state=checked]]:border-amber-500 has-[[data-state=checked]]:bg-amber-50 dark:has-[[data-state=checked]]:bg-amber-950/20"
                >
                  <RadioGroupItem value={m.userId} id={m.userId} />
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xs">
                      <User size={14} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {displayName}
                    </p>
                  </div>
                  <Crown size={14} className="text-amber-500 shrink-0" />
                </Label>
              );
            })}
          </RadioGroup>
        )}

        {activeMembers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Không có thành viên nào khác trong phòng.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleConfirm}
            className="w-full gap-2"
          >
            {selectedId ? (
              <>
                <Crown size={15} />
                Chuyển quyền &amp; rời phòng
              </>
            ) : (
              <>
                <LogOut size={15} />
                Rời phòng (về chế độ tự do)
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
