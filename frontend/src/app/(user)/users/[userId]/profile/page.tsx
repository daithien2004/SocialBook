'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

const UserProfilePage = () => {
    // Sau này bạn có thể map form này từ API overview
    const [form, setForm] = useState({
        displayName: 'Vinh',
        bio: '',
        website: '',
        location: '',
        job: '',
        social: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        console.log('Saving profile...', form);
    };

    const handleCancel = () => {
        console.log('Cancel edit profile');
    };

    return (
        <div className="rounded-lg bg-white shadow-sm border border-gray-100">
            <div className="relative rounded-t-lg bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500 px-6 py-10 md:py-12">
                {/* Pattern background */}
                <div className="pointer-events-none absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIi8+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] bg-repeat"></div>
                </div>

                {/* Nội dung profile trong banner */}
                <div className="relative flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 p-1">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white/40 backdrop-blur">
                                <Camera className="h-10 w-10 text-white opacity-90" />
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100">
                            <Camera className="h-4 w-4 text-teal-600" />
                        </button>
                    </div>

                    {/* Tên hiển thị */}
                    <input
                        type="text"
                        name="displayName"
                        value={form.displayName}
                        onChange={handleChange}
                        className="mb-2 w-full max-w-xs rounded-lg border-0 bg-white/90 px-6 py-3 text-center text-base font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>
            </div>

            {/* Các ô nhập thuộc tính bên dưới giống Wattpad */}
                <div className="bg-white rounded-b-lg px-6 py-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Giới thiệu */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Giới thiệu về bạn / hồ sơ
                        </label>
                        <textarea
                            name="bio"
                            rows={3}
                            value={form.bio}
                            onChange={handleChange}
                            placeholder="Viết đôi lời giới thiệu về bản thân, nội dung bạn sáng tác, phong cách, sở thích..."
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Website / Trang cá nhân
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://trangcuaban.com"
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    {/* Địa điểm */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Địa điểm
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="TP. Hồ Chí Minh, Việt Nam"
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    {/* Nghề nghiệp */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nghề nghiệp / Vai trò
                        </label>
                        <input
                            type="text"
                            name="job"
                            value={form.job}
                            onChange={handleChange}
                            placeholder="Tác giả, Designer, Developer..."
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    {/* Mạng xã hội */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mạng xã hội
                        </label>
                        <input
                            type="text"
                            name="social"
                            value={form.social}
                            onChange={handleChange}
                            placeholder="@username trên TikTok, Instagram, X..."
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <Button
                            className="bg-orange-500 text-white hover:bg-orange-600"
                            onClick={handleSave}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
