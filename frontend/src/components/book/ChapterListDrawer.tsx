import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Chapter {
  id: string;
  slug: string;
  title: string;
  orderIndex: number;
}

interface ChapterListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  bookSlug: string;
  currentChapterSlug?: string;
  totalChapters?: number;
  hasHeader?: boolean;
}

export default function ChapterListDrawer({
  isOpen,
  onClose,
  chapters,
  bookSlug,
  currentChapterSlug,
  totalChapters,
  hasHeader = false,
}: ChapterListDrawerProps) {
  const router = useRouter();

  const handleChapterSelect = (slug: string) => {
    onClose();
    router.push(`/books/${bookSlug}/chapters/${slug}`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed ${
          hasHeader ? 'top-15' : 'top-0'
        } right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#1a1a1a] border-l border-gray-300 dark:border-white/10 z-[61] shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white transition-colors duration-300">
              Mục lục
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors duration-300">
              {totalChapters || chapters.length} chương
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chapters.map((chap) => {
            const isActive = chap.slug === currentChapterSlug;
            return (
              <button
                key={chap.id}
                onClick={() => handleChapterSelect(chap.slug)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border flex items-center justify-between group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500/30 text-blue-900 dark:text-blue-100'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                    }`}
                  >
                    Chương {chap.orderIndex}
                  </span>
                  <span className="text-sm font-medium line-clamp-1">
                    {chap.title}
                  </span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
