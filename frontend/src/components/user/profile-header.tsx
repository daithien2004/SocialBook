'use client'
import Image from 'next/image';
import { UserAvatar } from "@/components/common/UserAvatar";
import { useModalStore } from "@/store/useModalStore";
import { motion } from "framer-motion";

interface PropsProfileHeader {
    username: string | undefined,
    image: string | null | undefined,
    postCount: number | undefined,
    readingListCount: number | undefined,
    followersCount: number | undefined,
    profileUserId: string,
}

export function ProfileHeader(props: PropsProfileHeader) {
    const { openFollowers } = useModalStore();

    return (
        <div className="relative w-full overflow-hidden border-b border-border">
            {/* Background Image Container with Premium Blended Overlays */}
            <div className="absolute inset-0 h-full w-full overflow-hidden bg-slate-900">
                <Image
                    src="/main-background.jpg"
                    alt="Cover Banner"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover opacity-40 mix-blend-overlay transition-transform duration-700 hover:scale-105"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto max-w-5xl px-6 pt-20 pb-14 flex flex-col items-center text-center">

                {/* Avatar */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-5 group"
                >
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md" />
                    <UserAvatar
                        src={props.image}
                        name={props.username}
                        className="h-36 w-36 border-4 border-background relative text-4xl font-extrabold shadow-xl rounded-full"
                        fallbackClassName="bg-muted text-foreground font-black"
                    />
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight mb-8 text-white drop-shadow-md"
                >
                    {props.username}
                </motion.h1>

                {/* Stats Grid - Glassmorphism style */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-3 gap-6 md:gap-12 px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl text-white max-w-xl w-full"
                >
                    <div className="flex flex-col items-center cursor-default py-1">
                        <span className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            {props.postCount ?? 0}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                            Bài viết
                        </span>
                    </div>

                    <div className="flex flex-col items-center cursor-default py-1 border-x border-white/10">
                        <span className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            {props.readingListCount ?? 0}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                            Thư viện
                        </span>
                    </div>

                    <div
                        onClick={() => openFollowers({ userId: props.profileUserId, count: props.followersCount })}
                        className="flex flex-col items-center cursor-pointer hover:bg-white/5 dark:hover:bg-white/10 rounded-2xl py-1 transition-all duration-300"
                    >
                        <span className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            {props.followersCount ?? 0}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                            Theo dõi
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
