'use client';

import { BookOpen } from 'lucide-react';

export function Header() {
  return (
    <div className="z-50 transition-all duration-300 border-b border-gray-200">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
                SocialBook
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
