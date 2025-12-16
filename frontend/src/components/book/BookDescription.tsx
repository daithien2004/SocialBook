import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface BookDescriptionProps {
  description: string;
  tags: string[];
  title: string;
  author: string;
}

export const BookDescription = ({ description, tags, title, author }: BookDescriptionProps) => {
  return (
    <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 shadow-sm dark:shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
        <BookOpen className="text-red-600 dark:text-red-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          Giới thiệu tác phẩm
        </h2>
      </div>

      <div className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-4 text-base md:text-lg font-light">
        <p>{description}</p>
        <p className="text-gray-500 dark:text-gray-400 italic border-l-2 border-red-500 pl-4 bg-gray-50 dark:bg-transparent py-2 pr-2">
          "Cuốn sách {title} của tác giả {author} mang đến một câu chuyện đầy
          cảm xúc và ý nghĩa..."
        </p>
      </div>

      {tags?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/books?tags=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/5 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 rounded-md text-xs transition-colors text-gray-500"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
