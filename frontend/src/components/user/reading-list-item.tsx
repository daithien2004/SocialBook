import Image from "next/image";
import { BookOpen, Globe, Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useGetCollectionDetailNoAuthQuery } from "@/features/library/api/libraryApi";
import { Card, CardContent } from "@/components/ui/card";

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
    const isPublic = response?.isPublic;
    const previewBooks = books.slice(0, 4);

    return (
        <Card
            onClick={() => router.push(`/collections/${id}`)}
            className="group border-border/85 hover:border-red-500/40 hover:shadow-lg transition-all duration-300 bg-card cursor-pointer overflow-hidden"
        >
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 flex-1 min-w-0">
                        {name}
                    </h3>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-bold uppercase tracking-wide ml-2">
                        {isPublic ? <Globe size={10} /> : <Lock size={10} />}
                        {books.length}
                    </span>
                </div>

                {/* Book covers grid */}
                {previewBooks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5">
                        {previewBooks.map((book) => (
                            <div
                                key={book.id}
                                className="relative aspect-[3/4] rounded-md overflow-hidden bg-muted"
                            >
                                <Image
                                    src={book.bookId.coverUrl}
                                    alt={book.bookId.title}
                                    fill
                                    sizes="(max-width: 768px) 25vw, 10vw"
                                    className="object-cover transition-all duration-500 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <BookOpen size={24} className="opacity-40 mb-2" />
                        <span className="text-[11px] font-medium">Trống</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
