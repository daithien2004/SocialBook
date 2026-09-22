'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { X, Home, Users, BookOpen, BarChart2, LogOut, PenLine, Shapes, AlertTriangle, ShieldAlert, Gauge } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/admin/dashboard' },
  { name: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Books', icon: BookOpen, href: '/admin/books' },
  { name: 'Authors', icon: PenLine, href: '/admin/authors' },
  { name: 'Genres', icon: Shapes, href: '/admin/genres' },
  { name: 'Moderation', icon: AlertTriangle, href: '/admin/moderation-queue' },
  { name: 'Toxic Dictionary', icon: ShieldAlert, href: '/admin/toxic-words' },
  { name: 'Rate Limits', icon: Gauge, href: '/admin/rate-limits' },
];

export default function AdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-md flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="ml-4 text-xl font-bold">SocialBook</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center px-4 py-3 w-full text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
