'use client'
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {UserCheck, UserPlus} from "lucide-react";
import {FollowingUser, useToggleFollowMutation} from "@/src/features/follows/api/followApi";
import {useState} from "react";
import {useRouter} from "next/navigation";

const FollowingItem = (props: FollowingUser) => {
    const [isFollowing, setIsFollowing] = useState(props.isFollowedByCurrentUser);

    const [toggleFollow, { isLoading: isToggling }] = useToggleFollowMutation();

    const router = useRouter();

    const handleToggleFollow = async  () => {

        try {
            await toggleFollow(props.id).unwrap();
            setIsFollowing((prev) => !prev);
        } catch (e: any) {
            console.log("Toggle follow failed:", e);
        }
    };
    return(
        <div
            className="group relative bg-white rounded-md border border-neutral-200 shadow-md transition-all duration-500 overflow-hidden flex flex-col"
        >
            {/* Cover Image */}
            <div
                className="h-24 w-full relative bg-neutral-100 overflow-hidden">
                <Image
                    src="/img_1.png"
                    alt={`${props.username} cover`}
                    fill
                    className="object-cover transition-transform duration-700 rou grayscale-[20%] group-hover:grayscale-0"
                />
            </div>

            {/* Content */}
            <div className="px-3 pb-1 pt-12 relative flex-1 flex flex-col items-center text-center">
                {/* Avatar - Floating */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <div className="cursor-pointer h-20 w-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-neutral-50"
                         onClick={()=>{router.push(`/users/${props.id}`)}}>
                        <Image
                            src={props.image || "/user.png"}
                            alt={props.username}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {/* User Info */}
                <div className="space-y-1 mb-2">
                    <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-neutral-700 transition-colors">
                        {props.username}
                    </h3>
                </div>

                <Button
                    variant="ghost"
                    disabled={isToggling}
                    onClick={handleToggleFollow}
                    className={`w-full rounded-md font-medium text-xs tracking-wide transition-all duration-300 ${
                        isFollowing
                            ? "bg-teal-700 text-white hover:bg-teal-600 shadow-xm shadow-neutral-900/20"
                            : "bg-white border border-neutral-200 text-foreground hover:bg-neutral-100"
                    }`}
                >
                    {isFollowing ? (
                        <>
                            <UserCheck className="mr-2 h-3.5 w-3.5" />
                            Đang theo dõi
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-3.5 w-3.5" />
                            Theo dõi
                        </>
                    )}
                </Button>
            </div>
            <div className="relative z-10 mt-1 pt-2 pb-2 flex justify-center text-center text-xs
             text-neutral-600 bg-green-50  overflow-hidden">
                        <div className="w-1/3 flex flex-col items-center py-1">
                            <span className="font-bold text-xm text-gray-600">{props.postCount}</span>
                            <span className="text-[8px] text-neutral-600 uppercase">Bài viết</span>
                        </div>

                        <div className="w-1/3 flex flex-col items-center py-1">
                            <span className="font-bold text-xm text-gray-600">{props.readingListCount}</span>
                            <span className="text-[8px] text-neutral-600 uppercase">Danh sách</span>
                        </div>

                        <div className="w-1/3 flex flex-col items-center py-1">
                            <span className="font-bold text-xm text-gray-600">{props.followersCount}</span>
                            <span className="text-[8px] text-neutral-600 uppercase">Người theo dõi</span>
                        </div>
            </div>
        </div>
    );
}

export default  FollowingItem