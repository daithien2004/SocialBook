// src/components/admin/book/DeleteBookModal.tsx
'use client';

import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { BookForAdmin } from '@/src/features/books/types/book.interface';

interface DeleteBookModalProps {
    book: BookForAdmin | null;
    isOpen: boolean;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteBookModal({
    book,
    isOpen,
    isDeleting,
    onClose,
    onConfirm,
}: DeleteBookModalProps) {
    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Xác nhận xóa sách</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        Bạn có chắc chắn muốn xóa sách{' '}
                        <span className="font-bold text-gray-900">"{book.title}"</span>?
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến sách này sẽ bị xóa vĩnh viễn.
                        </p>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>• Tác giả: <span className="font-medium">{book.authorId?.name || 'N/A'}</span></p>
                        <p>• Số chương: <span className="font-medium">{book.stats.chapters}</span></p>
                        <p>• Lượt xem: <span className="font-medium">{book.stats.views.toLocaleString()}</span></p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xóa...
                            </>
                        ) : (
                            'Xóa sách'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
