'use client';

import { Button } from '@/src/components/ui/button';
import {
    useGetUserOverviewQuery, usePatchUpdateUserAvatarMutation,
    usePatchUpdateUserProfileOverviewMutation,
} from '@/src/features/users/api/usersApi';
import { getErrorMessage } from "@/src/lib/utils";
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from "sonner";

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onPickAvatar = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // reset để chọn lại cùng 1 file vẫn fire onChange
        }
        fileInputRef.current?.click();
    };

    const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    // dọn URL tránh leak bộ nhớ
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleCancelAvatar = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // quan trọng
    };

    const { data: overview, isLoading: isOverviewLoading } =
        useGetUserOverviewQuery(userId, { skip: !userId });

    const [updateOverview, { isLoading: isSaving }] =
        usePatchUpdateUserProfileOverviewMutation();

    const [updateAvatar, { isLoading: isSavingAvatarApi }] =
        usePatchUpdateUserAvatarMutation();

    // form state
    const [form, setForm] = useState({
        displayName: '',
        website: '',
        location: '',
        bio: '',
    });

    const handleSaveAvatar = async () => {
        if (!selectedFile || !userId) return;
        try {
            setSavingAvatar(true);

            // Gọi RTK Query mutation upload avatar
            const res = await updateAvatar({
                userId,
                file: selectedFile,
            }).unwrap();

            toast.success('Thay đổi hình ảnh thành công');

            handleCancelAvatar();
        } catch (err: any) {
            console.log(getErrorMessage(err));
            // toast.error(getErrorMessage(err));
        } finally {
            setSavingAvatar(false);
        }
    };


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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await updateOverview({
                userId,
                body: {
                    username: form.displayName,
                    bio: form.bio,
                    location: form.location,
                    website: form.website,
                },
            }).unwrap();
            toast.success('Cập nhật hồ sơ thành công');
        } catch (err: any) {
            console.log(getErrorMessage(err));
        }
    };

    return (
        <div
            className="
      rounded-2xl
      bg-white dark:bg-neutral-900
      shadow-sm
      border border-slate-100 dark:border-gray-800
    "
        >
            {/* Header */}
            <div
                className="relative rounded-t-2xl bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500 px-6 py-10 md:py-12">
                <div className="pointer-events-none absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIi8+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] bg-repeat"></div>
                </div>

                {/* Avatar + name */}
                <div className="relative flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onAvatarFileChange}
                        />

                        <button
                            onClick={onPickAvatar}
                            disabled={savingAvatar}
                            className="
              relative group rounded-full
              ring-4 ring-white dark:ring-gray-800
              shadow-lg disabled:opacity-60
            "
                        >
                            <div
                                className="relative h-24 w-24 rounded-full p-[2px] bg-gradient-to-br from-indigo-500 to-cyan-400 overflow-hidden">
                                <img
                                    src={
                                        previewUrl ??
                                        overview?.image ??
                                        "https://placehold.co/200x200?text=Avatar"
                                    }
                                    alt="User avatar"
                                    className="h-full w-full object-cover rounded-full"
                                />
                            </div>

                            <span className="
              absolute inset-0 hidden group-hover:flex
              items-center justify-center
              rounded-full
              bg-black/40
              text-white text-xs font-medium
            ">
                                Đổi ảnh
                            </span>
                        </button>

                        {selectedFile && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                <button
                                    onClick={handleCancelAvatar}
                                    disabled={savingAvatar}
                                    className="
                  px-2 py-1 rounded-full text-[10px]
                  border border-slate-200 dark:border-gray-700
                  bg-white dark:bg-neutral-900
                  text-slate-700 dark:text-gray-200
                  hover:bg-slate-50 dark:hover:bg-gray-800
                "
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveAvatar}
                                    disabled={savingAvatar}
                                    className="
                  px-3 py-1 rounded-full text-[10px]
                  bg-gray-900 dark:bg-neutral-900
                  text-white
                  hover:bg-black dark:hover:bg-gray-900
                  disabled:opacity-60
                "
                                >
                                    {savingAvatar ? "Đang lưu..." : "Lưu"}
                                </button>
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        name="displayName"
                        value={form.displayName}
                        onChange={handleChange}
                        className="
            mb-2 rounded-lg border-0
            bg-white/90 dark:bg-neutral-800
            px-6 py-3 text-center text-base font-semibold
            text-slate-800 dark:text-gray-100
            placeholder-slate-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2
            focus:ring-white/50 dark:focus:ring-gray-700
          "
                    />
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-b-2xl px-6 py-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                            Giới thiệu về bạn / hồ sơ
                        </label>
                        <textarea
                            name="bio"
                            rows={3}
                            value={form.bio}
                            onChange={handleChange}
                            placeholder="Viết đôi lời giới thiệu…"
                            className="
              mt-1 w-full rounded-lg
              border border-slate-200 dark:border-gray-700
              bg-slate-50 dark:bg-neutral-900
              px-3 py-2 text-sm
              text-slate-800 dark:text-gray-100
              outline-none
              focus:border-teal-500
              focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40
            "
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                            Website / Trang cá nhân
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://trangcuaban.com"
                            className="
              mt-1 w-full rounded-lg
              border border-slate-200 dark:border-gray-700
              bg-slate-50 dark:bg-neutral-900
              px-3 py-2 text-sm
              text-slate-800 dark:text-gray-100
              outline-none
              focus:border-teal-500
              focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40
            "
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                            Địa điểm
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="TP. Hồ Chí Minh, Việt Nam"
                            className="
              mt-1 w-full rounded-lg
              border border-slate-200 dark:border-gray-700
              bg-slate-50 dark:bg-neutral-900
              px-3 py-2 text-sm
              text-slate-800 dark:text-gray-100
              outline-none
              focus:border-teal-500
              focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40
            "
                        />
                    </div>

                    {isDirty && (
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                disabled={isSaving}
                                onClick={() =>
                                    setForm({
                                        displayName: overview?.username ?? '',
                                        website: overview?.website ?? '',
                                        location: overview?.location ?? '',
                                        bio: overview?.bio ?? '',
                                    })
                                }
                                className="
                bg-slate-100 dark:bg-gray-800
                text-slate-700 dark:text-gray-200
                hover:bg-slate-200 dark:hover:bg-gray-700
              "
                            >
                                Hoàn tác
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-orange-500 text-white hover:bg-orange-600"
                            >
                                {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
