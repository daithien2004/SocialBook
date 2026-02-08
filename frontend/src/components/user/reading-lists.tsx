import { Plus, Settings } from 'lucide-react';
import { ReadingListItem } from '@/components/user/reading-list-item';
import { useGetCollectionsQuery } from '@/features/library/api/libraryApi';
import { useParams, useRouter } from 'next/navigation';
export function ReadingLists() {
  const { userId } = useParams<{ userId: string }>();
  const { data: collectionsData = [] } = useGetCollectionsQuery(userId);
  const route = useRouter();
  return (
      <div
          className="
      rounded-2xl
      bg-white dark:bg-neutral-900
      shadow-sm
      border border-slate-100 dark:border-gray-800
    "
      >
        {/* Header */}
        <div className="py-5 px-4">
          <div className="flex items-center justify-between">
        <span className="text-xl font-semibold font-serif text-slate-800 dark:text-gray-100">
          {`Danh sách đọc (${collectionsData.length})`}
        </span>

            <div className="flex gap-2 text-slate-400 dark:text-gray-400">
              <button
                  onClick={() => route.push('/library')}
                  className="
              cursor-pointer
              hover:text-slate-600 dark:hover:text-gray-200
              transition-colors
            "
              >
                <Settings className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <hr className="mt-4 mb-6 border-slate-200 dark:border-gray-800" />

          {collectionsData.map((c) => (
              <ReadingListItem {...c} key={c.id} />
          ))}
        </div>
      </div>
  );
}
