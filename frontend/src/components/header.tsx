'use client';

import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  return (
    <div className="z-50 transition-all duration-300 border-b border-gray-200">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex justify-center items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center hover:to-red-300"
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
                  SocialBook
                </h1>
              </div>
            </div>
            <div
              onClick={() => router.push('/books')}
              className="font-bold px-4 py-2 rounded-md shadow-md text-gray-600 hover:bg-gray-100 flex gap-3"
            >
              <BookOpen /> Tìm Kiếm Sách
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
