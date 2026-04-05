'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function StepCompletion({ onSubmit }: any) {
  useEffect(() => {
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default || confettiModule;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#818cf8', '#fbbf24', '#ffffff'], // Indigo-ish colors
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="bg-primary p-8 text-center relative overflow-hidden">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Mọi thứ đã sẵn sàng!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"
          />
        </div>

        <div className="p-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-center"
          >
            Chúng tôi đã cá nhân hóa trải nghiệm dành riêng cho bạn. Hãy sẵn
            sàng khám phá cuốn sách yêu thích tiếp theo và xây dựng thói quen
            đọc bền vững.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 text-center"
          >
            <div className="text-5xl mb-3">🏅</div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-1">
              Phần thưởng đầu tiên
            </p>
            <p className="text-foreground text-lg font-bold">
              Huy hiệu Người Mới đã được mở khóa!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={() => onSubmit({})}
              size="lg"
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Bắt đầu khám phá ngay →
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
