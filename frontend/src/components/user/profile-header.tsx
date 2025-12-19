'use client'
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import { FollowersModal} from "@/src/components/user/FollowersModal";
import {useState} from "react";

interface PropsProfileHeader {
    username: string | undefined,
    image: string | null | undefined,
    postCount: number | undefined,
    readingListCount: number | undefined,
    followersCount: number | undefined,
    profileUserId: string,
}
export function ProfileHeader(props: PropsProfileHeader) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="relative w-full pt-8 pb-8 text-white">
                <img
                    src="/background.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-0" />

                <div className="relative z-10 container mx-auto flex flex-col items-center text-center">
                    <Avatar className="h-28 w-28 border border-white/20 dark:border-gray-700">
                        <AvatarImage
                            src={props.image ?? "/user.png"}
                            alt={props.username ?? "user"}
                            className="object-cover"
                        />
                    </Avatar>

                    <h1 className="mt-2 text-2xl font-bold text-white">
                        {props.username}
                    </h1>
                </div>

                <div className="relative z-10 mt-3 flex justify-center gap-6 text-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold">{props.postCount}</span>
                        <span className="text-xs text-white/70 uppercase">Bài đăng</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-white/80">
                        <span className="text-lg font-bold">{props.readingListCount}</span>
                        <span className="text-xs text-white/70 uppercase">Danh sách đọc</span>
                    </div>

                    <div
                        onClick={() => setOpen(true)}
                        className="flex flex-col items-center cursor-pointer hover:text-white/80"
                    >
                        <span className="text-lg font-bold">{props.followersCount}</span>
                        <span className="text-xs text-white/70 uppercase">Người theo dõi</span>
                    </div>
                </div>

                <FollowersModal isOpen={open} onClose={() => setOpen(false)} />
            </div>
        </>
    );
}
