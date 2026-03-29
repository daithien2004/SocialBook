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
        } catch (error) {
            console.error('Confirm action failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isConfirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
            <AlertDialogContent className="max-w-[400px] rounded-2xl border-none shadow-2xl">
                <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {confirmData.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                        {confirmData.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
                    <AlertDialogCancel 
                        disabled={isLoading}
                        className="rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-800 font-semibold"
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
                            variant: confirmData.variant || "default", 
                            className: `rounded-xl font-bold px-6 shadow-lg min-w-[100px] ${
                                confirmData.variant === "destructive" ? "shadow-red-500/20" : 
                                confirmData.variant === "default" ? "shadow-blue-500/20" : ""
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
