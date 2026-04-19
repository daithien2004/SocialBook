'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    useGetUserOverviewQuery, usePatchUpdateUserAvatarMutation,
    usePatchUpdateUserProfileOverviewMutation,
} from '@/features/users/api/usersApi';
import { useParams } from 'next/navigation';
import { useUserProfile } from '@/features/users/hooks/useUserProfile';

const COUNTRIES = [
    "Việt Nam",
    "Hoa Kỳ (USA)",
    "Vương Quốc Anh (Anh)",
    "Nhật Bản",
    "Hàn Quốc",
    "Trung Quốc",
    "Đài Loan",
    "Singapore",
    "Thái Lan",
    "Pháp",
    "Đức",
    "Nga",
    "Úc",
    "Canada"
];

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();

    const [updateOverview] = usePatchUpdateUserProfileOverviewMutation();
    const [updateAvatar] = usePatchUpdateUserAvatarMutation();

    const { data: overview } =
        useGetUserOverviewQuery(userId, { skip: !userId });

    const {
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
    } = useUserProfile({
        userId,
        overview,
        updateOverview: async (params) => {
            await updateOverview({
                ...params,
                body: {
                    username: params.body.username || '',
                    bio: params.body.bio || '',
                    location: params.body.location || '',
                    website: params.body.website || '',
                },
            }).unwrap();
        },
        updateAvatar: async (params) => {
            await updateAvatar(params).unwrap();
        },
    });

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
                            onChange={handleAvatarChange}
                        />

                        <button
                            onClick={handlePickAvatar}
                            disabled={isSavingAvatar}
                            className="
              relative group rounded-full
              ring-4 ring-white dark:ring-gray-800
              shadow-lg disabled:opacity-60
            "
                        >
                            <div
                                className="relative h-24 w-24 rounded-full p-[2px] bg-gradient-to-br from-indigo-500 to-cyan-400 overflow-hidden">
                                <Image
                                    src={
                                        previewUrl ??
                                        overview?.image ??
                                        "https://placehold.co/200x200?text=Avatar"
                                    }
                                    alt="User avatar"
                                    fill
                                    unoptimized={Boolean(previewUrl)}
                                    sizes="96px"
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
                                    disabled={isSavingAvatar}
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
                                    disabled={isSavingAvatar}
                                    className="
                  px-3 py-1 rounded-full text-[10px]
                  bg-gray-900 dark:bg-neutral-900
                  text-white
                  hover:bg-black dark:hover:bg-gray-900
                  disabled:opacity-60
                "
                                >
                                    {isSavingAvatar ? "Đang lưu..." : "Lưu"}
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
                            Quốc gia / Lãnh thổ
                        </label>
                        <select
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            className="
              mt-1 w-full rounded-lg
              border border-slate-200 dark:border-gray-700
              bg-slate-50 dark:bg-neutral-900
              px-3 py-2 text-sm
              text-slate-800 dark:text-gray-100
              outline-none appearance-none
              focus:border-teal-500
              focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40
            "
                        >
                            <option value="">-- Chọn quốc gia --</option>
                            {COUNTRIES.map((ct) => (
                                <option key={ct} value={ct}>
                                    {ct}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isDirty && (
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                disabled={isSaving}
                                onClick={handleResetForm}
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
