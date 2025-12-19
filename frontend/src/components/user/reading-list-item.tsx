import { BookItem } from "@/src/components/user/book-item";
import { ChevronRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useGetCollectionDetailNoAuthQuery } from "@/src/features/library/api/libraryApi";

interface ReadingListItemProps {
    id: string;
    name: string;
}

export function ReadingListItem(props: ReadingListItemProps) {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const { id, name } = props;

    const { data: response } = useGetCollectionDetailNoAuthQuery({ id, userId });
    const books = response?.books || [];

    if (books.length === 0) return null;

    return (
        <div className="space-y-2 pb-6">
            {/* Title */}
            <div className="flex items-center">
        <span className="text-xl font-semibold font-serif text-slate-800 dark:text-gray-100">
          {name}
        </span>

                <ChevronRight
                    strokeWidth={1.5}
                    className="w-5 h-5 text-slate-500 dark:text-gray-400 relative top-[1px] -ml-[1px]"
                />
            </div>

            {/* Subtitle */}
            <div>
        <span className="text-sm font-notosans font-medium text-slate-500 dark:text-gray-400">
          {`Danh sách đọc • ${books.length} sách`}
        </span>
            </div>

            {/* Books */}
            <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                {books.map((c) => (
                    <BookItem
                        key={c.id}
                        slug={c.bookId.slug}
                        bookImage={c.bookId.coverUrl}
                        bookId={c.bookId.id}
                        bookName={c.bookId.title}
                        authorName={c.bookId.authorId.name}
                    />
                ))}
            </div>
        </div>
    );
}
