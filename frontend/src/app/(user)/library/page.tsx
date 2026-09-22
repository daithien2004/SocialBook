import Image from 'next/image';
import { Suspense } from 'react';
import LibraryClientSection from './_components/LibraryClientSection';

export const metadata = {
  title: 'Thư viện của tôi — SocialBook',
  description: 'Quản lý tủ sách cá nhân, tiến độ đọc và bộ sưu tập của bạn',
};

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300 font-sans selection:bg-brand selection:text-brand-foreground">
      {/* HERO BANNER — Server rendered */}
      <div className="relative w-full h-[30vh] min-h-[260px] max-h-[350px] flex items-center justify-center overflow-hidden bg-primary/5 dark:bg-black border-b border-border/40">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background dark:from-black/50 dark:via-black/70 dark:to-background" />
        <div className="relative z-10 text-center w-full max-w-3xl px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight drop-shadow-sm">
            Thư Viện Của Tôi
          </h1>
          <p className="text-muted-foreground mb-4 text-sm md:text-base font-medium max-w-xl drop-shadow-sm">
            Quản lý tủ sách cá nhân, tiến độ đọc và bộ sưu tập của bạn một cách tiện lợi nhất.
          </p>
        </div>
      </div>

      {/* CLIENT SECTION */}
      <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse bg-muted rounded-2xl" /></div>}>
        <LibraryClientSection />
      </Suspense>
    </div>
  );
}
