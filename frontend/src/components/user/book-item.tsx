import Image from "next/image";
import { Eye, Heart, List } from "lucide-react";
import { useGetBookStatsQuery } from "@/src/features/books/api/bookApi";
import { formatNumber } from "@/src/lib/utils";
import { useRouter } from "next/navigation";

interface BookItemProps {
    bookId: string;
    bookName: string;
    authorName: string;
    bookImage: string;
    slug: string;
}

export function BookItem(props: BookItemProps) {
    const { data: stats } = useGetBookStatsQuery(props.bookId);
    const router = useRouter();

    return (
        <div className="flex gap-2 mt-1 mb-3">
            <div className="group relative w-[140px]">
                {/* Book cover */}
                <div
                    onClick={() => router.push(`/books/${props.slug}`)}
                    className="
            relative aspect-[4/6] w-[140px]
            overflow-hidden rounded-xl
            shadow-md dark:shadow-none
            bg-slate-100 dark:bg-gray-900
            cursor-pointer
            transition-transform
          "
                >
                    <Image
                        src={props.bookImage}
                        alt={props.bookName}
                        fill
                        className="object-cover"
                    />

                    {/* Hover overlay (dark) */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/40 transition-colors" />
                </div>

                {/* Info */}
                <div className="mt-2 space-y-1">
                    <h4
                        onClick={() => router.push(`/books/${props.slug}`)}
                        className="
              font-semibold text-base font-serif leading-tight line-clamp-2
              text-slate-900 dark:text-gray-100
              group-hover:text-[#ff9800]
              transition-colors cursor-pointer
            "
                    >
                        {props.bookName}
                    </h4>

                    <p className="text-xs font-serif font-semibold text-slate-500 dark:text-gray-400">
                        {props.authorName}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                            <Eye className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">
                {formatNumber(stats?.views)}
              </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Heart className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">
                {formatNumber(stats?.likes)}
              </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <List className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">
                {formatNumber(stats?.chapters)}
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
