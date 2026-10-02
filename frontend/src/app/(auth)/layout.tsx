import { ReactNode } from 'react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/shared';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground h-dvh overflow-hidden flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <Image
          src="https://res.cloudinary.com/dajg703uq/image/upload/v1763780207/snapedit_1763780184287_v11fnr.jpg"
          alt="Auth background"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 py-10 px-10 text-white">
          <div className="max-w-2xl mx-auto ml-10">
            <h1 className="text-5xl font-bold leading-tight font-serif mb-4">
              LES MISERABLES
            </h1>
            <p className="text-2xl text-white/90 font-serif italic border-l-4 border-white/60 pl-4">
              &quot;Even the darkest night will end and the sun will rise.&quot;
            </p>
            <p className="mt-4 text-lg font-medium">— Victor Hugo</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 overflow-hidden bg-gray-50 dark:bg-zinc-950">
        <div className="h-full flex items-center justify-center px-6 py-12">
          {children}
        </div>
      </div>
    </main>
  );
}
