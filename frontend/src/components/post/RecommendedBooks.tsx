'use client';

import { List } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  coverImage: string;
  chapters: number;
  status: 'completed' | 'ongoing';
  description: string;
}

const recommendedBooks: Book[] = [
  {
    id: '1',
    title: 'Dragon Ball Supernatural',
    coverImage:
      'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300&h=400&fit=crop',
    chapters: 50,
    status: 'completed',
    description:
      "Like Goku, Ketsu was a Saiyan Survivor of Emperor Frieza's...",
  },
  {
    id: '2',
    title: 'Worlds in Danger Mha, Solo Leveling',
    coverImage:
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
    chapters: 21,
    status: 'completed',
    description:
      'The emeralds start humming and buzzing as Eggman looks back on them...',
  },
  {
    id: '3',
    title: '- Just Saiyan -',
    coverImage:
      'https://images.unsplash.com/photo-1626618012641-bfbca5a31239?w=300&h=400&fit=crop',
    chapters: 42,
    status: 'ongoing',
    description:
      'Y/n L/n, one of the seven saiyans living on Remnant since the unknown...',
  },
  {
    id: '4',
    title: 'Book 1: The Wrath of The Earthborn',
    coverImage:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=400&fit=crop',
    chapters: 22,
    status: 'completed',
    description:
      '"Didn\'t I realise tell you did this?" Goku growls. "I wasn\'t born on this planet..."',
  },
  {
    id: '5',
    title: 'Dragon Ball Z: King Slug',
    coverImage:
      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop',
    chapters: 18,
    status: 'completed',
    description:
      "A Saiyan's pride can be a powerful, prideful tool. Between Vegeta's boot heel...",
  },
];

export default function RecommendedBooks() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-gray-800">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
          Bạn cũng có thể thích
        </h2>
      </div>

      {/* Book list */}
      <div className="max-h-[600px] overflow-y-auto thin-scrollbar">
        {recommendedBooks.map((book) => (
          <div
            key={book.id}
            className="px-4 py-2 border-b border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
          >
            <div className="flex gap-3">
              {/* Cover */}
              <div className="relative flex-shrink-0">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-20 h-30 rounded-lg object-cover border border-slate-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {book.title}
                </h3>

                {/* Chapters */}
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 mb-1.5">
                  <span className="inline-flex items-center">
                    <List className="w-3 h-3 mr-1" />
                    {book.chapters} chương
                  </span>
                </div>

                {/* Status badge */}
                <div className="mb-1.5">
                  {book.status === 'completed' ? (
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Hoàn thành
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Trưởng thành
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {book.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
