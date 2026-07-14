'use client';

import { useModalStore } from "@/store/useModalStore";
import { Tag } from "lucide-react";
import { 
    useCreateGenreMutation, 
    useUpdateGenreMutation 
} from "@/features/genres/api/genreApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { AdminFormModal, FormField } from "@/features/admin/components/AdminFormModal";

const FIELDS: FormField[] = [
  {
    key: 'name',
    label: 'Tên thể loại',
    type: 'text',
    placeholder: 'Tiểu thuyết, Trinh thám...',
    required: true,
    maxLength: 100,
  },
  {
    key: 'description',
    label: 'Mô tả',
    type: 'textarea',
    placeholder: 'Mô tả ngắn về thể loại này...',
    maxLength: 500,
  },
];

export default function GenreModal() {
    const { isGenreModalOpen, closeGenreModal, genreModalData } = useModalStore();
    const isEdit = !!genreModalData?.genre;

    const [createGenre, { isLoading: isCreating }] = useCreateGenreMutation();
    const [updateGenre, { isLoading: isUpdating }] = useUpdateGenreMutation();
    const isLoading = isCreating || isUpdating;

    const handleSubmit = async (values: Record<string, string>) => {
        const name = values.name?.trim();
        const description = values.description?.trim();

        if (!name) {
            toast.info('Tên thể loại không được để trống!');
            return;
        }

        try {
            if (isEdit && genreModalData?.genre) {
                await updateGenre({
                    id: genreModalData.genre.id,
                    data: {
                        name,
                        description: description || undefined,
                    },
                }).unwrap();
                toast.success('Cập nhật thể loại thành công!');
            } else {
                await createGenre({
                    name,
                    description: description || undefined,
                }).unwrap();
                toast.success('Tạo thể loại thành công!');
            }

            genreModalData?.onSuccess?.();
            closeGenreModal();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <AdminFormModal
            isOpen={isGenreModalOpen}
            onClose={closeGenreModal}
            title={isEdit ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
            icon={<Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            isLoading={isLoading}
            fields={FIELDS}
            initialValues={genreModalData?.genre || {}}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? 'Cập nhật' : 'Tạo thể loại'}
        />
    );
}
