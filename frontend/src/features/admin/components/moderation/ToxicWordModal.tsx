import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AddToxicWordPayload } from '@/features/admin/api/toxicWordsApi';

const formSchema = z.object({
    pattern: z.string().min(1, 'Vui lòng nhập từ khoá').max(100, 'Từ khoá quá dài'),
    group: z.string().min(1, 'Vui lòng chọn nhóm từ khoá')
});

interface ToxicWordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddToxicWordPayload) => Promise<void>;
    isSubmitting?: boolean;
    initialWord?: string;
}

const TOXIC_GROUPS = [
    { value: 'thô tục mạnh', label: 'Thô tục mạnh (Chửi thề, tục tĩu)' },
    { value: 'thô tục nhẹ', label: 'Thô tục nhẹ' },
    { value: 'xúc phạm', label: 'Xúc phạm, công kích' },
    { value: 'nhạy cảm', label: 'Nhạy cảm (Chính trị, tôn giáo)' },
    { value: 'quảng cáo', label: 'Spam, quảng cáo rác' },
];

export function ToxicWordModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    initialWord
}: ToxicWordModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<AddToxicWordPayload>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pattern: initialWord || '',
            group: 'thô tục mạnh'
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                pattern: initialWord || '',
                group: 'thô tục mạnh'
            });
        }
    }, [isOpen, initialWord, reset]);

    const handleFormSubmit = async (data: AddToxicWordPayload) => {
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch {
            // Error handled by hook
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm từ khoá mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="pattern">Từ khoá <span className="text-red-500">*</span></Label>
                        <Input
                            id="pattern"
                            placeholder="Nhập từ khoá (vd: ngu, chó...)"
                            {...register('pattern')}
                            disabled={isSubmitting}
                        />
                        {errors.pattern && (
                            <p className="text-sm text-red-500">{errors.pattern.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group">Nhóm phân loại <span className="text-red-500">*</span></Label>
                        <select
                            id="group"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register('group')}
                            disabled={isSubmitting}
                        >
                            {TOXIC_GROUPS.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                        {errors.group && (
                            <p className="text-sm text-red-500">{errors.group.message}</p>
                        )}
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lưu từ khoá
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
