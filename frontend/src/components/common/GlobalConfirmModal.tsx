'use client';

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
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function GlobalConfirmModal() {
    const { isConfirmOpen, closeConfirm, confirmData } = useModalStore();
    const [isLoading, setIsLoading] = useState(false);

    if (!confirmData) return null;

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await confirmData.onConfirm();
            closeConfirm();
        } catch {
            toast.error('Thao tác thất bại, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isConfirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
            <AlertDialogContent className="sm:max-w-[420px] bg-background/95 dark:bg-black/80 backdrop-blur-xl p-0 gap-0 border border-border/60 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                <AlertDialogHeader className="sr-only">
                    <AlertDialogTitle>{confirmData.title}</AlertDialogTitle>
                    <AlertDialogDescription>{confirmData.description}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="px-6 py-5 border-b border-border/40 bg-black/[0.02] dark:bg-white/5">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {confirmData.title}
                    </h2>
                </div>

                <div className="px-6 py-6 bg-transparent">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {confirmData.description}
                    </p>
                </div>

                <AlertDialogFooter className="px-6 py-4 border-t border-border/40 bg-black/[0.02] dark:bg-white/5 sm:justify-end gap-3">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="rounded-xl border-border/50 hover:bg-black/[0.05] dark:hover:bg-white/10 font-bold text-sm h-10 px-5 transition-colors mt-0 sm:mt-0"
                    >
                        {confirmData.cancelText || "Hủy"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isLoading}
                        className={buttonVariants({
                            variant: confirmData.variant === 'destructive' ? 'outline' : confirmData.variant || "default",
                            className: `rounded-xl font-bold px-6 text-sm shadow-sm h-10 transition-colors ${
                                confirmData.variant === 'destructive' 
                                    ? 'border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300' 
                                    : ''
                            }`
                        })}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            confirmData.confirmText || "Xác nhận"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
