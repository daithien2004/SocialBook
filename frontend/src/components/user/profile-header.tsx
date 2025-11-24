'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";

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
  return (
      <div className="relative w-full text-white pt-8 pb-8">
        <img
            src="/background.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 container mx-auto flex flex-col items-center justify-center text-center">
          <div className="rounded-full p-1">
            <Avatar className="h-28 w-28 border-2 border-white/20">
              <AvatarImage src={props.image ?? ""} alt={props.username ?? "user"} />
              <AvatarFallback className="bg-[#4a332a] text-4xl text-white">V</AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-bold">{props.username}</h1>
        </div>

        <div className="relative z-10 mt-2 flex justify-center text-center text-sm">

          <div className="w-1/10 flex flex-col items-center cursor-pointer hover:text-white/80">
            <span className="font-bold text-lg">{props.postCount}</span>
            <span className="text-xs text-white/70 uppercase">Bài đăng</span>
          </div>

          <div
                onClick={()=>{router.push(`/users/${props.profileUserId}`)}}
              className="w-1/10 flex flex-col items-center cursor-pointer hover:text-white/80">
            <span className="font-bold text-lg">{props.readingListCount}</span>
            <span
                className="text-xs text-white/70 uppercase">Danh Sách Đọc</span>
          </div>

          <div className="w-1/10 flex flex-col items-center hover:text-white/80">
            <span className="font-bold text-lg">{props.followersCount}</span>
            <span className="text-xs text-white/70 uppercase">Người Theo Dõi</span>
          </div>
        </div>
      </div>
  )
}
