'use client';
import Image from 'next/image';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { cn } from '@/lib/utils';
interface ReadingProgressProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export function ReadingProgress({ userId, displayName, avatarUrl }: ReadingProgressProps) {
  const presences = useReadingRoomStore((s) => s.presences);
  const presence = presences[userId];

  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary overflow-hidden shadow-inner">
        {avatarUrl ? (
          <Image src={avatarUrl || ''} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className={cn(
        'absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-background rounded-full',
        presence ? 'bg-green-500' : 'bg-muted-foreground/30',
      )} />
    </div>
  );
}
