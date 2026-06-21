'use client';

import Image from 'next/image';
import { KnowledgeGraph } from '@/components/profile/KnowledgeGraph';
import { useGetKnowledgeGraphQuery } from '@/features/library/api/libraryApi';
import { motion } from 'framer-motion';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';
import { BrainCircuit, Sparkles } from 'lucide-react';

export default function KnowledgeMapPage() {
  const { isAuthenticated } = useAppAuth();
  const { data, isLoading, error } = useGetKnowledgeGraphQuery(undefined, { skip: !isAuthenticated });

  if (!isAuthenticated) {
    return (
      <LoginWall
        icon={<BrainCircuit size={40} className="text-primary" />}
        title="Vũ trụ Tri thức"
        description="Đăng nhập để khám phá mạng lưới kết nối giữa những cuốn sách, tác giả và chủ đề bạn đã chinh phục."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      {/* HERO BANNER */}
      <div className="relative w-full h-[35vh] min-h-[280px] max-h-[400px] flex items-center justify-center overflow-hidden bg-slate-900 dark:bg-black">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        <div className="relative z-10 text-center w-full max-w-4xl px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Powered Map
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md"
          >
            Vũ Trụ Tri Thức <span className="text-white/90 font-black">Của Bạn</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/85 text-sm md:text-lg max-w-2xl font-medium drop-shadow-sm leading-relaxed"
          >
            Khám phá mạng lưới kết nối giữa những cuốn sách, tác giả và chủ đề bạn đã chinh phục.
            Mỗi điểm sáng đại diện cho một bước chân trên hành trình khai phóng tư duy.
          </motion.p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-8 py-10 relative z-10 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative group rounded-3xl"
        >
          {/* Decorative background glow matching the brand */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-violet-500/20 to-primary/30 rounded-[2.5rem] blur-3xl opacity-40 group-hover:opacity-60 transition duration-1000" />
          
          <KnowledgeGraph 
            data={data || { nodes: [], links: [] }} 
            isLoading={isLoading} 
          />
        </motion.div>

        {error && (
          <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm text-center font-semibold">
            Đã có lỗi xảy ra khi tải dữ liệu bản đồ. Vui lòng thử lại sau.
          </div>
        )}
      </main>
    </div>
  );
}


