import { List } from 'lucide-react';
import { ReadingListItem } from '@/components/user/reading-list-item';
import { useGetCollectionsQuery } from '@/features/library/api/libraryApi';
import { Collection } from '@/features/library/types/library.interface';
import { useParams, useRouter } from 'next/navigation';

const EMPTY_COLLECTIONS: Collection[] = [];
export function ReadingLists() {
  const { userId } = useParams<{ userId: string }>();
  const { data: collectionsData = EMPTY_COLLECTIONS } = useGetCollectionsQuery(userId);
  const route = useRouter();
  return (
      <div
          className="
      rounded-2xl
      bg-white dark:bg-neutral-900
      shadow-sm
      border border-border
    "
      >
        {/* Header */}
        <div className="py-5 px-4">
          <div className="flex items-center justify-between">
        <span className="text-xl font-semibold font-serif text-foreground">
          {`Danh sách đọc (${collectionsData.length})`}
        </span>

            <div className="flex gap-2 text-muted-foreground">
              <button
                  onClick={() => route.push('/library')}
                  className="
              cursor-pointer
              hover:text-slate-600 dark:hover:text-gray-200
              transition-colors
            "
              >
                <List className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <hr className="mt-4 mb-6 border-border" />

          {collectionsData.map((c) => (
              <ReadingListItem {...c} key={c.id} />
          ))}
        </div>
      </div>
  );
}
