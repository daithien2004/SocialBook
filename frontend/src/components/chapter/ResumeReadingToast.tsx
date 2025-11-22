// src/components/chapter/ResumeReadingToast.tsx
'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface ResumeReadingToastProps {
  progress: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ResumeReadingToast({
  progress,
  onConfirm,
  onClose,
}: ResumeReadingToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Chỉ hiện nếu progress > 5% để tránh làm phiền khi mới đọc vài dòng
    if (progress > 5) {
      const timer = setTimeout(() => setIsVisible(true), 1000); // Hiện sau 1s để trang load xong
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  const handleConfirm = () => {
    setIsVisible(false);
    onConfirm();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-gray-900/95 backdrop-blur text-white px-4 py-3 rounded-lg shadow-2xl border border-gray-700 flex items-center gap-4 max-w-sm">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-200">
            Bạn đang đọc dở chương này
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Tiếp tục tại vị trí {progress}%?
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            title="Bỏ qua"
          >
            <X size={18} />
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-lg"
          >
            <RotateCcw size={14} />
            Đọc tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
