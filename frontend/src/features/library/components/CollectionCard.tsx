import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Globe, Lock, Folder } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { libraryQueries } from '@/features/library/api/library.queries';
import { Collection } from '@/features/library/types/library.interface';
import { useModalStore } from '@/store/useModalStore';
import { formatDate } from '@/lib/utils';

export function CollectionCard({ col }: { col: Collection }) {
  const router = useRouter();
  const { data: detail } = useQuery({ ...libraryQueries.collectionDetail(col.id) });
  const books = detail?.books || [];
  const openEditCollection = useModalStore(s => s.openEditCollection);

  const covers = books.slice(0, 3).map((b) => b.bookId.coverUrl);

  return (
    <div
      onClick={() => router.push(`/collections/${col.id}`)}
      className="group relative flex flex-col justify-between h-36 bg-card rounded-2xl border border-border p-5 hover:border-brand/40 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80 group-hover:opacity-100 transition-opacity z-10" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          openEditCollection({
            collectionId: col.id,
            currentName: col.name,
            currentIsPublic: col.isPublic,
          });
        }}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-pointer"
        title="Chỉnh sửa bộ sưu tập"
      >
        <Pencil size={12} className="text-muted-foreground" />
      </button>

      <div className="flex gap-4 items-start justify-between h-full min-w-0 z-10">
        <div className="flex flex-col justify-between h-full min-w-0 flex-1">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground truncate group-hover:text-brand transition-colors">
              {col.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {col.description || 'Chưa có mô tả bộ sưu tập.'}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground font-medium mt-auto">
            <span className="flex items-center text-muted-foreground" title={col.isPublic ? "Công khai" : "Chỉ mình tôi"}>
              {col.isPublic ? (
                <Globe size={13.5} className="text-muted-foreground" />
              ) : (
                <Lock size={13.5} className="text-muted-foreground" />
              )}
            </span>
            <span>{formatDate(col.createdAt)}</span>
          </div>
        </div>

        <div className="relative w-20 h-24 flex items-center justify-center shrink-0 self-center">
          {covers.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-end">
              {covers[2] && (
                <div className="absolute w-[40px] h-[56px] right-7 top-4 -rotate-12 z-0 opacity-40 shadow-sm rounded-sm overflow-hidden border border-white/10 dark:border-black/20">
                  <SafeImage
                    src={covers[2]}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              )}
              {covers[1] && (
                <div className="absolute w-[44px] h-[62px] right-3.5 top-2 -rotate-6 z-10 opacity-75 shadow-md rounded-sm overflow-hidden border border-white/10 dark:border-black/20">
                  <SafeImage
                    src={covers[1]}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              )}
              {covers[0] && (
                <div className="absolute w-[48px] h-[68px] right-0 top-1.5 rotate-3 z-20 shadow-lg rounded-sm overflow-hidden border border-white/20 dark:border-black/40 group-hover:scale-105 group-hover:rotate-0 transition-all duration-300">
                  <SafeImage
                    src={covers[0]}
                    alt=""
                    fill
                    preload
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/5 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Folder className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
