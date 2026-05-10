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
            <AlertDialogContent className="max-w-[400px] rounded-xl border border-border shadow-lg p-6">
                <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-lg font-bold text-foreground">
                        {confirmData.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                        {confirmData.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
                    <AlertDialogCancel 
                        disabled={isLoading}
                        className="rounded-lg border-border hover:bg-muted font-medium text-sm"
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
                            className: "rounded-lg font-bold px-6 text-sm shadow-sm"
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
