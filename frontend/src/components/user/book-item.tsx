import Image from "next/image";
import { Eye, Heart, List } from "lucide-react";
import { useGetBookStatsQuery } from "@/features/books/api/bookApi";
import { formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { memo } from "react";

interface BookItemProps {
    bookId: string;
    bookName: string;
    authorName: string;
    bookImage: string;
    slug: string;
    showStats?: boolean;
}

export const BookItem = memo(function BookItem(props: BookItemProps) {
    const { data: stats } = useGetBookStatsQuery(props.bookId, {
        skip: props.showStats === false,
    });
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
            bg-muted
            cursor-pointer
            transition-transform
          "
                >
                    <Image
                        src={props.bookImage}
                        alt={props.bookName}
                        fill
                        sizes="140px"
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
              text-foreground
              group-hover:text-primary
              transition-colors cursor-pointer
            "
                    >
                        {props.bookName}
                    </h4>

                    <p className="text-xs font-serif font-semibold text-muted-foreground">
                        {props.authorName}
                    </p>

                    {props.showStats !== false && (
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
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
                {formatNumber(stats?.chapterCount)}
              </span>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
});
