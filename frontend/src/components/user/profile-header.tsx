'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowersModal } from "@/components/user/FollowersModal";
import { useState } from "react";

interface PropsProfileHeader {
    username: string | undefined,
    image: string | null | undefined,
    postCount: number | undefined,
    readingListCount: number | undefined,
    followersCount: number | undefined,
    profileUserId: string,
}

export function ProfileHeader(props: PropsProfileHeader) {
    const [openModal, setOpenModal] = useState(false);

    return (
        <div className="relative w-full">
            {/* Background Image Container */}
            <div className="absolute inset-0 h-full w-full overflow-hidden">
                <img
                    src="/background.jpg"
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto max-w-4xl px-4 pt-16 pb-12 flex flex-col items-center text-center text-white">

                {/* Avatar with Ring */}
                <div className="relative mb-4 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
                    <Avatar className="h-32 w-32 border-4 border-black relative">
                        <AvatarImage
                            src={props.image ?? "/user.png"}
                            alt={props.username ?? "user"}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-800 text-3xl font-bold">
                            {props.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-6 text-white drop-shadow-md">
                    {props.username}
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-8 md:gap-12 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-2xl font-bold group-hover:text-indigo-300 transition-colors">
                            {props.postCount ?? 0}
                        </span>
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                            Bài viết
                        </span>
                    </div>

                    <div className="flex flex-col items-center group cursor-pointer hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors">
                        <span className="text-2xl font-bold group-hover:text-indigo-300 transition-colors">
                            {props.readingListCount ?? 0}
                        </span>
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                            Danh sách đọc
                        </span>
                    </div>

                    <div
                        onClick={() => setOpenModal(true)}
                        className="flex flex-col items-center group cursor-pointer hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors"
                    >
                        <span className="text-2xl font-bold group-hover:text-indigo-300 transition-colors">
                            {props.followersCount ?? 0}
                        </span>
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                            Người theo dõi
                        </span>
                    </div>
                </div>
            </div>

            <FollowersModal isOpen={openModal} onClose={() => setOpenModal(false)} />
        </div>
    );
}
