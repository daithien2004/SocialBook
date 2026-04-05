'use client'

import { AlertTriangle, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useModalStore } from '@/store/useModalStore';

export default function DeleteBookModal() {
    const { isDeleteBookOpen, closeDeleteBook, deleteBookData } = useModalStore();

    if (!deleteBookData) return null;

    const { book, isDeleting, onConfirm } = deleteBookData;

    return (
        <AlertDialog open={isDeleteBookOpen} onOpenChange={closeDeleteBook}>
            <AlertDialogContent className="max-w-md w-full overflow-hidden p-0 border-none shadow-2xl">
                {/* Header */}
                <AlertDialogHeader className="bg-red-50 px-6 py-6 border-b border-red-100 flex-row items-center gap-4 space-y-0">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Xác nhận xóa sách
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-red-600/80 text-xs font-medium mt-0.5 uppercase tracking-wider">
                            Hành động không thể hoàn tác
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>

                {/* Content */}
                <div className="p-6 bg-white">
                    <p className="text-gray-700 leading-relaxed">
                        Bạn có chắc chắn muốn xóa sách{' '}
                        <span className="font-bold text-gray-900">"{book?.title}"</span>?
                    </p>
                    
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800 leading-relaxed">
                            <strong>Lưu ý:</strong> Tất cả dữ liệu liên quan bao gồm chương, lượt xem và audio sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </p>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chương</p>
                            <p className="text-lg font-bold text-gray-900">{book?.stats.chapterCount}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lượt xem</p>
                            <p className="text-lg font-bold text-gray-900">{book?.stats.views.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yêu thích</p>
                            <p className="text-lg font-bold text-gray-900">{book?.stats.likes || '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <AlertDialogFooter className="bg-gray-50 px-6 py-4 gap-3 sm:gap-0 border-t border-gray-100">
                    <AlertDialogCancel 
                        disabled={isDeleting}
                        onClick={closeDeleteBook}
                        className="rounded-xl border-gray-200 hover:bg-gray-100 font-semibold px-6"
                    >
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className={buttonVariants({ 
                            variant: "destructive", 
                            className: "rounded-xl font-bold px-8 shadow-lg shadow-red-500/20" 
                        })}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Đang xóa...
                            </>
                        ) : (
                            'Xóa vĩnh viễn'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
