import { Plus, Settings } from "lucide-react"
import {ReadingListItem} from "@/src/components/user/reading-list-item";
import {useGetCollectionsQuery} from "@/src/features/library/api/libraryApi";
import {useParams, useRouter} from "next/navigation";
export function ReadingLists() {
  const { userId } = useParams<{ userId: string }>();
  const { data: collectionsData = [] } = useGetCollectionsQuery(userId);
  const route = useRouter();
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-100">
      {/* Header */}
      <div className="py-5 px-4">
        <div className="flex items-center justify-between border-gray-100">
          <span className="text-xl font-semibold font-serif text-gray-800">{`Danh sách đọc (${collectionsData.length})`}</span>
          <div className="flex gap-2 text-gray-400">
            <button
                onClick={()=>(route.push("/library"))}
                className="hover:text-gray-600 cursor-pointer">
              <Settings className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <hr className="mt-4 mb-6 border-gray-300" />
        {collectionsData.map((c) => (
            <ReadingListItem {...c} key={c.id} />
        ))}
      </div>
    </div>
  );
}
