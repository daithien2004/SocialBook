import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(10)].map((_, i) => (
        <Card key={`skeleton-book-${i}`} className="flex flex-col h-full overflow-hidden border-border/80">
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border mt-auto">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
