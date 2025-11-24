import Image from "next/image";
import {Eye, Heart, List} from "lucide-react";
import { useGetBookStatsQuery } from "@/src/features/books/api/bookApi";
import {formatNumber} from "@/src/lib/utils";

interface BookItemProps {
    bookId: string;
    bookName: string;
    authorName: string;
    bookImage: string;
}

export function BookItem(props: BookItemProps) {
    const { data: stats, isLoading, error } = useGetBookStatsQuery(props.bookId);

    return (
        <div className="flex gap-2 mt-1 mb-3">
            <div className="group relative w-[140px]">

                <div className="relative aspect-[4/6] w-[140px] overflow-hidden shadow-md transition-transform cursor-pointer">
                    <Image
                        src={props.bookImage}
                        alt={props.bookName}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="mt-2 space-y-1">
                    <h4 className="font-semibold text-base font-serif leading-tight text-gray-900 line-clamp-2 group-hover:text-[#ff9800] transition-colors cursor-pointer">
                        {props.bookName}
                    </h4>

                    <p className="text-xs font-serif font-semibold text-gray-500">
                        {props.authorName}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <div className="flex items-center gap-1">
                            <Eye className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">{formatNumber(stats?.views)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Heart className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">{formatNumber(stats?.likes)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <List className="h-4 w-3 relative -top-[0.5px]" />
                            <span className="font-serif text-[12px]">{formatNumber(stats?.chapters)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
