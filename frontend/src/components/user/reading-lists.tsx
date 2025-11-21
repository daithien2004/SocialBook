import { Plus, Settings } from "lucide-react"
import {ReadingListItem} from "@/src/components/user/reading-list-item";
export function ReadingLists() {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-100">
      {/* Header */}
      <div className="py-5 px-4">
        <div className="flex items-center justify-between border-gray-100">
          <span className="text-xl font-semibold font-serif text-gray-800">1 Danh Sách Đọc</span>
          <div className="flex gap-2 text-gray-400">
            <button className="hover:text-gray-600">
              <Plus className="h-5 w-5" />
            </button>
            <button className="hover:text-gray-600">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        <hr className="mt-4 mb-6 border-gray-300" />
        <ReadingListItem/>
        <ReadingListItem/>
      </div>
    </div>
  );
}
