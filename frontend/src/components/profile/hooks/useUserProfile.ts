import { useState, useEffect, useMemo, useRef, useCallback, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export interface ProfileFormData {
    displayName: string;
    website: string;
    location: string;
    bio: string;
}

interface UseUserProfileOptions {
    userId: string;
    overview?: {
        username?: string;
        website?: string;
        location?: string;
        bio?: string;
        image?: string | null;
    } | null;
    updateOverview: (params: { userId: string; body: { username?: string; bio?: string; location?: string; website?: string } }) => Promise<void>;
    updateAvatar: (params: { userId: string; file: File }) => Promise<void>;
}

export interface UseUserProfileResult {
    form: ProfileFormData;
    isDirty: boolean;
    isSaving: boolean;
    isSavingAvatar: boolean;
    previewUrl: string | null;
    selectedFile: File | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSave: () => Promise<void>;
    handleAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handlePickAvatar: () => void;
    handleCancelAvatar: () => void;
    handleSaveAvatar: () => Promise<void>;
    handleResetForm: () => void;
}

export function useUserProfile({
    userId,
    overview,
    updateOverview,
    updateAvatar,
}: UseUserProfileOptions): UseUserProfileResult {
    const [form, setForm] = useState<ProfileFormData>({
        displayName: '',
        website: '',
        location: '',
        bio: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!overview) return;
        setForm({
            displayName: overview.username ?? '',
            website: overview.website ?? '',
            location: overview.location ?? '',
            bio: overview.bio ?? '',
        });
    }, [overview]);

    const isDirty = useMemo(() => {
        if (!overview) return false;
        return (
            (form.website ?? '') !== (overview.website ?? '') ||
            (form.location ?? '') !== (overview.location ?? '') ||
            (form.bio ?? '') !== (overview.bio ?? '') ||
            (form.displayName ?? '') !== (overview.username ?? '')
        );
    }, [overview, form.website, form.location, form.bio, form.displayName]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setIsSaving(true);
            await updateOverview({
                userId,
                body: {
                    username: form.displayName,
                    bio: form.bio,
                    location: form.location,
                    website: form.website,
                },
            });
            toast.success('Cập nhật hồ sơ thành công');
        } catch (err: any) {
            console.log(getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    }, [userId, form, updateOverview]);

    const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }, []);

    const handlePickAvatar = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
    }, []);

    const handleCancelAvatar = useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [previewUrl]);

    const handleSaveAvatar = useCallback(async () => {
        if (!selectedFile || !userId) return;
        try {
            setIsSavingAvatar(true);
            await updateAvatar({
                userId,
                file: selectedFile,
            });
            toast.success('Thay đổi hình ảnh thành công');
            handleCancelAvatar();
        } catch (err: any) {
            console.log(getErrorMessage(err));
        } finally {
            setIsSavingAvatar(false);
        }
    }, [selectedFile, userId, updateAvatar, handleCancelAvatar]);

    const handleResetForm = useCallback(() => {
        setForm({
            displayName: overview?.username ?? '',
            website: overview?.website ?? '',
            location: overview?.location ?? '',
            bio: overview?.bio ?? '',
        });
    }, [overview]);

    return {
        form,
        isDirty,
        isSaving,
        isSavingAvatar,
        previewUrl,
        selectedFile,
        fileInputRef,
        handleChange,
        handleSave,
        handleAvatarChange,
        handlePickAvatar,
        handleCancelAvatar,
        handleSaveAvatar,
        handleResetForm,
    };
}
