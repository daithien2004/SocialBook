import { Header } from '@/components/header';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import {ThemeProvider} from "next-themes";

const ChatWidget = dynamic(
  () => import('@/components/ChatWidget').then((module) => module.ChatWidget),
  { ssr: false }
);

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/main-background.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300" />
        </div>

        <div className="relative z-10">
          <Header />
          <main className="pt-16 min-h-screen">{children}</main>

          <ChatWidget />
        </div>
      </div>
    </ThemeProvider>
  );
}
