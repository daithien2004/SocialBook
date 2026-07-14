'use client';

import { useModalStore } from "@/store/useModalStore";
import { User } from "lucide-react";
import { 
    useCreateAuthorMutation, 
    useUpdateAuthorMutation 
} from "@/features/authors/api/authorApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { AdminFormModal, FormField } from "@/features/admin/components/AdminFormModal";

const FIELDS: FormField[] = [
  {
    key: 'photoUrl',
    label: 'Ảnh đại diện',
    type: 'image',
  },
  {
    key: 'name',
    label: 'Tên tác giả',
    type: 'text',
    placeholder: 'Nguyễn Nhật Ánh...',
    required: true,
  },
  {
    key: 'bio',
    label: 'Tiểu sử',
    type: 'textarea',
    placeholder: 'Mô tả về tác giả...',
  },
];

export default function AuthorModal() {
    const { isAuthorModalOpen, closeAuthorModal, authorModalData } = useModalStore();
    const isEdit = !!authorModalData?.author;

    const [createAuthor, { isLoading: isCreating }] = useCreateAuthorMutation();
    const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();
    const isLoading = isCreating || isUpdating;

    const handleSubmit = async (values: Record<string, string>, files: Record<string, File | null>) => {
        const name = values.name?.trim();
        const bio = values.bio?.trim();

        if (!name) {
            toast.info('Tên tác giả không được để trống!');
            return;
        }

        try {
            const formPayload = new FormData();
            formPayload.append('name', name);
            formPayload.append('bio', bio);

            const photoFile = files.photoUrl;
            if (photoFile) {
                formPayload.append('photoUrl', photoFile);
            }

            if (isEdit && authorModalData?.author) {
                await updateAuthor({
                    id: authorModalData.author.id,
                    data: formPayload,
                }).unwrap();
                toast.success('Cập nhật tác giả thành công!');
            } else {
                await createAuthor(formPayload).unwrap();
                toast.success('Tạo tác giả thành công!');
            }

            authorModalData?.onSuccess?.();
            closeAuthorModal();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <AdminFormModal
            isOpen={isAuthorModalOpen}
            onClose={closeAuthorModal}
            title={isEdit ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
            icon={<User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            isLoading={isLoading}
            fields={FIELDS}
            initialValues={authorModalData?.author || {}}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? 'Cập nhật' : 'Tạo tác giả'}
        />
    );
}
