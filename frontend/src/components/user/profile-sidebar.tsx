import type React from "react"
import { Facebook, Twitter, Mail, Pin } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ProfileSidebar() {
  return (
    <>
      {/* About Card */}
      <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Cuộc đời tôi</h3>

        <div className="space-y-4">
          <div className="text-base font-serif text-gray-600">
            <span className="font-semibold text-gray-900">Đã tham gia</span> tháng 9 11, 2025
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="mb-3 text-sm font-light font-display text-black uppercase">Đang theo dõi</h4>
            <div className="flex gap-2">
              <img
                  src="https://i.pravatar.cc/40?img=1"
                  alt="avatar-1"
                  className="h-8 w-8 rounded-full object-cover"
              />
              <img
                  src="https://i.pravatar.cc/40?img=2"
                  alt="avatar-2"
                  className="h-8 w-8 rounded-full object-cover"
              />
              <img
                  src="https://i.pravatar.cc/40?img=3"
                  alt="avatar-3"
                  className="h-8 w-8 rounded-full object-cover"
              />
              <img
                  src="https://i.pravatar.cc/40?img=4"
                  alt="avatar-4"
                  className="h-8 w-8 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <h4 className="mb-3 text-sm font-light font-display text-black uppercase">Chia sẻ hồ sơ</h4>
            <div className="flex gap-2">
              <SocialButton color="bg-[#3b5998]" icon={<Facebook className="h-4 w-4" />} />
              <SocialButton color="bg-[#1da1f2]" icon={<Twitter className="h-4 w-4" />} />
              <SocialButton color="bg-[#bd081c]" icon={<span className="font-serif font-bold text-sm">P</span>} />
              <SocialButton color="bg-[#35465c]" icon={<span className="font-bold text-sm">t</span>} />
              <SocialButton color="bg-[#f96a0e]" icon={<Mail className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Last Message */}
      {/*<div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">*/}
      {/*  <div className="flex items-center gap-2 mb-4 text-gray-500">*/}
      {/*    <Pin className="h-4 w-4 rotate-45" />*/}
      {/*    <h3 className="text-sm font-bold text-gray-700">Tin nhắn Cuối cùng</h3>*/}
      {/*  </div>*/}

      {/*  <div className="flex gap-3">*/}
      {/*    <Avatar className="h-10 w-10">*/}
      {/*      <AvatarFallback className="bg-[#5d4037] text-white">V</AvatarFallback>*/}
      {/*    </Avatar>*/}
      {/*    <div className="flex-1">*/}
      {/*      <div className="flex items-baseline gap-2">*/}
      {/*        <span className="font-bold text-sm text-gray-900">huuvinh2608</span>*/}
      {/*        <span className="text-xs text-gray-400">3 giờ trước</span>*/}
      {/*      </div>*/}
      {/*      <p className="mt-1 text-sm text-gray-600">Cuộc đời tôihttps://www.wattpad.com/story/395687803</p>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="mt-4">*/}
      {/*    <button className="w-full rounded bg-gray-100 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">*/}
      {/*      Xem tất cả các Cuộc Hội Thoại*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </>
  )
}

function SocialButton({ color, icon }: { color: string; icon: React.ReactNode }) {
  return (
    <button
      className={`${color} flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90`}
    >
      {icon}
    </button>
  )
}
