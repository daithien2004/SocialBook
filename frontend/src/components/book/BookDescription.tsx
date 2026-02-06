'use client';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

interface BookDescriptionProps {
  description: string;
  tags: string[];
  title: string;
  author: string;
}

export const BookDescription = ({ description, tags, title, author }: BookDescriptionProps) => {
  return (
    <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg bg-card">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-wide">
          <BookOpen className="text-red-600 dark:text-red-500" size={24} />
          Giới thiệu tác phẩm
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="text-muted-foreground leading-relaxed space-y-4 text-base md:text-lg font-light">
          <p>{description}</p>
          <p className="text-muted-foreground italic border-l-2 border-red-500 pl-4 bg-muted/30 py-2 pr-2 rounded-r-md">
            "Cuốn sách {title} của tác giả {author} mang đến một câu chuyện đầy
            cảm xúc và ý nghĩa..."
          </p>
        </div>

        {tags?.length > 0 && (
          <div className="pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/books?tags=${encodeURIComponent(tag)}`}
                >
                  <Badge
                    variant="outline"
                    className="hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 px-3 text-xs font-normal text-muted-foreground"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
