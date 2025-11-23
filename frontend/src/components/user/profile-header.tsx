import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PropsProfileHeader {
  username: string | undefined,
  image: string | null | undefined,
  postCount: number | undefined,
  readingListCount: number | undefined,
  followersCount: number | undefined,
}

export function ProfileHeader(props : PropsProfileHeader) {

  return (
    <div className="relative w-full bg-[#5d4037] text-white pt-8 pb-8">
      <div className="container mx-auto flex flex-col items-center justify-center text-center">
        {/* Avatar */}
        <div className="rounded-full border-4 border-[#5d4037] bg-[#5d4037] p-1">
          <Avatar className="h-28 w-28 border-2 border-white/20">
            <AvatarImage src="/placeholder.svg?height=112&width=112" alt="Vinh" />
            <AvatarFallback className="bg-[#4a332a] text-4xl text-white">V</AvatarFallback>
          </Avatar>
        </div>
        <h1 className="text-2xl font-bold">{props.username}</h1>
      </div>
      <div className="mt-2 flex justify-center text-center text-sm">
        <div className="w-1/12 flex flex-col items-center cursor-pointer hover:text-white/80">
          <span className="font-bold text-lg">{props.postCount}</span>
          <span className="text-xs text-white/70 uppercase">Bài đăng</span>
        </div>

        <div className="w-1/12 flex flex-col items-center cursor-pointer hover:text-white/80">
          <span className="font-bold text-lg">{props.readingListCount}</span>
          <span className="text-xs text-white/70 uppercase">Danh Sách Đọc</span>
        </div>

        <div className="w-1/12 flex flex-col items-center cursor-pointer hover:text-white/80">
          <span className="font-bold text-lg">{props.followersCount}</span>
          <span className="text-xs text-white/70 uppercase">Người Theo Dõi</span>
        </div>
      </div>
    </div>
  )
}
