import {UserCheck, UserPlus} from "lucide-react";
import {FollowingUser, useToggleFollowMutation} from "@/src/features/follows/api/followApi";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useSelector} from "react-redux";
import { RootState } from "@/src/store/store";
import {useRouter} from "next/navigation";

const FollowerItem = (props: FollowingUser) => {
    const auth = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(props.isFollowedByCurrentUser);
    const [toggleFollow, { isLoading: isToggling }] = useToggleFollowMutation();
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
            className="flex items-center justify-between gap-3 rounded-lg"
        >
            <div className="flex items-center gap-3">
                <img
                    src={props.image}
                    alt={props.username}
                    className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-x-1 text-md">
                                                        <span className="font-semibold text-gray-800">
                                                          {props.username}
                                                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {props.readingListCount > 0 && `${props.readingListCount} Danh sách đọc`}
                        {props.readingListCount > 0 && props.followersCount > 0 && ' • '}
                        {props.followersCount > 0 && `Người theo dõi ${props.followersCount}`}
                    </span>
                </div>
            </div>

            {
                props.id === auth?.user?.id ? (
                    <Button
                        variant="ghost"
                        disabled={isToggling}
                        onClick={()=>{router.push(`/users/${props.id}`)}}
                        className="rounded-md font-medium text-xs tracking-wide transition-all duration-300
                        bg-teal-700 text-white hover:bg-teal-600 shadow-xm shadow-neutral-900/20"
                    >
                        Xem hồ sơ
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            disabled={isToggling}
                            onClick={handleToggleFollow}
                            className={`rounded-md font-medium text-xs tracking-wide transition-all duration-300 ${
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
                    </>
                )
            }
        </div>
    );
}
export default FollowerItem