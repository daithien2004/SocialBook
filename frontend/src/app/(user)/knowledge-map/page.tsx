'use client';

import { KnowledgeGraph } from '@/components/profile/KnowledgeGraph';
import { useGetKnowledgeGraphQuery } from '@/features/library/api/libraryApi';
import { motion } from 'framer-motion';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';
import { BrainCircuit } from 'lucide-react';

export default function KnowledgeMapPage() {
  const { isAuthenticated } = useAppAuth();
  const { data, isLoading, error } = useGetKnowledgeGraphQuery(undefined, { skip: !isAuthenticated });

  if (!isAuthenticated) {
    return (
      <LoginWall
        icon={<BrainCircuit size={40} className="text-blue-600 dark:text-blue-400" />}
        title="Vũ trụ Tri thức"
        description="Đăng nhập để khám phá mạng lưới kết nối giữa những cuốn sách, tác giả và chủ đề bạn đã chinh phục."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs"
            >
              Bản sắc cá nhân
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-sans font-bold text-foreground"
            >
              Vũ trụ Tri thức <span className="text-primary">Của Bạn</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg max-w-2xl"
            >
              Khám phá mạng lưới kết nối giữa những cuốn sách, tác giả và chủ đề bạn đã chinh phục. 
              Mỗi điểm sáng là một bước chân trên hành trình khai phóng tư duy.
            </motion.p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          {/* Decorative background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/20 to-violet-500/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000" />
          
          <KnowledgeGraph 
            data={data || { nodes: [], links: [] }} 
            isLoading={isLoading} 
          />
        </motion.div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm text-center">
            Đã có lỗi xảy ra khi tải dữ liệu bản đồ. Vui lòng thử lại sau.
          </div>
        )}
      </div>
    </div>
  );
}


