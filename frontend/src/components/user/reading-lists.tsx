import { ReadingListItem } from '@/components/user/reading-list-item';
import { useGetCollectionsQuery } from '@/features/library/api/libraryApi';
import { Collection } from '@/features/library/types/library.interface';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

const EMPTY_COLLECTIONS: Collection[] = [];

export function ReadingLists() {
    const { userId } = useParams<{ userId: string }>();
    const { data: collectionsData = EMPTY_COLLECTIONS } = useGetCollectionsQuery(userId);

    return (
        <Card className="border-border shadow-sm">
            <CardContent className="py-5 px-4">
                <div className="flex items-center gap-2.5 mb-5">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Danh sách đọc
                    </h2>
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                        {collectionsData.length}
                    </span>
                </div>

                {collectionsData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {collectionsData.map((c) => (
                            <ReadingListItem {...c} key={c.id} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Chưa có danh sách đọc nào.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
