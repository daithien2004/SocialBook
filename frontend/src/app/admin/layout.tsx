'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, Home, Users, BookOpen, FileText, MessageSquare, BarChart2, LogOut, PenLine, Shapes } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/admin/dashboard' },
  { name: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Books', icon: BookOpen, href: '/admin/books' },
  { name: 'Posts', icon: FileText, href: '/admin/posts' },
  { name: 'Comments', icon: MessageSquare, href: '/admin/comments' },
  { name: 'Reports', icon: BarChart2, href: '/admin/reports' },
  { name: 'Authors', icon: PenLine , href: '/admin/authors' },
  { name: 'Genres', icon: Shapes , href: '/admin/genres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = session?.user;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-md ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">SocialBook</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center px-4 py-3 w-full text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-0 p-6">
        {children}
      </main>
    </div>
  );
}
