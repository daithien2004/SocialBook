import {BookItem} from "@/src/components/user/book-item";
import {ChevronRight} from "lucide-react";

export function ReadingListItem() {

    return (
        <>
            <div className="flex items-center">
                <span className="text-xl font-semibold font-serif text-gray-800 cursor-pointer">Viễn tưởng</span>
                <ChevronRight
                    strokeWidth={1.5}
                    className="w-5 h-5 text-gray-500 relative top-[1px] -ml-[1px]" />
            </div>
            <div>
                <span className="text-xs font-sans text-gray-500"> Danh Sách Đọc • 6 Sách</span>
            </div>
            <div className="flex items-center justify-start">
                <BookItem/>
                <BookItem/>
                <BookItem/>
                <BookItem/>
                <BookItem/>
            </div>
        </>
    )
}
