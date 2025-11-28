import {BookItem} from "@/src/components/user/book-item";
import {ChevronRight} from "lucide-react";
import {useParams, useRouter} from "next/navigation";
import {useGetCollectionDetailNoAuthQuery, useGetCollectionDetailQuery} from "@/src/features/library/api/libraryApi";

interface ReadingListItemProps
{
    id: string,
    name: string,
}
export function ReadingListItem(props: ReadingListItemProps) {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const {id, name} = props;

    const { data: response } = useGetCollectionDetailNoAuthQuery({ id, userId });
    const books = response?.books || [];
    if (books.length === 0)  return;
    return (
        <>
            <div className="flex items-center">
                <span className="text-xl font-semibold font-serif text-gray-800">{name}</span>
                <ChevronRight
                    strokeWidth={1.5}
                    className="w-5 h-5 text-gray-500 relative top-[1px] -ml-[1px]" />
            </div>
            <div>
                <span className="text-[14px] font-notosans font-medium text-gray-500">{`Danh Sách Đọc • ${books.length} Sách`}</span>
            </div>
            <div className="flex items-center justify-start gap-4">
                {books.map((c) => (
                    <BookItem
                        bookImage = {c.bookId.coverUrl}
                        bookId={c.bookId.id}
                        bookName={c.bookId.title}
                        authorName={c.bookId.authorId.name} key={c.id} />
                ))}
            </div>
        </>
    )
}
