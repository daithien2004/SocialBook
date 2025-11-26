import {BookItem} from "@/src/components/user/book-item";
import {ChevronRight} from "lucide-react";
import {useRouter} from "next/navigation";
import {useGetCollectionDetailQuery} from "@/src/features/library/api/libraryApi";

interface ReadingListItemProps
{
    id: string,
    name: string,
}
export function ReadingListItem(props: ReadingListItemProps) {
    const router = useRouter();
    const {id, name} = props;
    const {
        data: response,
    } = useGetCollectionDetailQuery(id);

    // const collection = response?.folder;
    const books = response?.books || [];
    if (books.length === 0)  return;
    return (
        <>
            <div onClick={()=>{router.push(`/collections/${id}`)}}
                 className="flex items-center">
                <span className="text-xl font-semibold font-serif text-gray-800 cursor-pointer">{name}</span>
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
