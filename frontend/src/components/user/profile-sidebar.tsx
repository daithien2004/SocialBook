"use client";

import type React from "react"
import { Facebook, Twitter, Mail, Pin } from "lucide-react"
import {useGetFollowingListQuery} from "@/src/features/follows/api/followApi";
import {useRouter} from "next/navigation";
import {formatDate} from "@/src/lib/utils";

interface ProfileNavProps {
  profileUserId: string;
  joinedAt: Date | undefined;
}

export function ProfileSidebar(props : ProfileNavProps) {
  const {profileUserId, joinedAt} = props
  const {
    data: following = [],
    isLoading,
    isError,
  } = useGetFollowingListQuery(profileUserId, {
    skip: !profileUserId,
  });
  const router = useRouter();
  const topFollowing = following.slice(0, 7);
  return (
      <>
        <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Cuộc đời tôi
          </h3>

          <div className="space-y-4">
            <div className="text-base font-serif text-gray-600">
              <span className="font-semibold text-gray-900">Đã tham gia</span>{" ngày "}
              {joinedAt ? formatDate(joinedAt) : "—"}
            </div>

            {!isLoading && !isError && topFollowing.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="mb-3 text-sm font-light font-display text-black uppercase">
                    Đang theo dõi
                  </h4>

                  <div className="flex -space-x-2">
                    {topFollowing.map((user) => (
                        <img
                            onClick={() => router.push(`/users/${user.id}`)}
                            key={user.id}
                            src={user.image || "https://i.pravatar.cc/40?img=15"}
                            className="h-8 w-8 rounded-full object-cover border-1 border-gray-400 cursor-pointer"
                        />
                    ))}
                  </div>
                </div>
            )}

            {isLoading && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="mb-3 text-sm font-light font-display text-black uppercase">
                    Đang theo dõi
                  </h4>
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"
                        />
                    ))}
                  </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h4 className="mb-3 text-sm font-light font-display text-black uppercase">
                Chia sẻ hồ sơ
              </h4>
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
