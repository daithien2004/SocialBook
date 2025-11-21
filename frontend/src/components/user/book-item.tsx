import Image from "next/image";
import {Eye, List, Star} from "lucide-react";

export function BookItem() {

    return (
        <>
            <div className="flex gap-2 mt-1 mb-3">
                <div className="group relative w-[140px]">
                    <div
                        className="relative aspect-[4/6] w-[120px] overflow-hidden rounded shadow-md transition-transform cursor-pointer">
                        <Image
                            src="/book_romantic.jpg"
                            alt="The Submissive Assassin"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="mt-2 space-y-1">
                        <h4 className="font-semibold text-base font-serif leading-tight text-gray-900 line-clamp-2 group-hover:text-[#ff9800] transition-colors cursor-pointer">
                            The Submissive Assassin (BxB)
                        </h4>
                        <p className="text-xs text-gray-500">J.A Elric</p>

                        <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-1">
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-2 relative -top-[0.5px]"/>
                                <span>2M</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-2 relative -top-[0.5px]"/>
                                <span>87.7K</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <List className="h-3 w-2 relative -top-[0.5px]"/>
                                <span>199</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
