"use client";

import type React from "react"
import { Facebook, Twitter, Mail } from "lucide-react"
import {useGetFollowingListQuery} from "@/features/follows/api/followApi";
import {useRouter} from "next/navigation";
import {formatDate} from "@/lib/utils";

// ⬇️ THÊM: import các button share từ next-share
import {
  FacebookShareButton,
  TwitterShareButton,
  EmailShareButton,
  PinterestShareButton,
  TumblrShareButton,
} from "next-share";

interface ProfileNavProps {
  profileUserId: string;
  bio: string | undefined
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

  // ⬇️ THÊM: URL hồ sơ để share (dùng được cả localhost)
  const origin =
      typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = `${origin}/users/${profileUserId}`;
  const shareTitle = "Xem hồ sơ người dùng này";

  return (
      <>
        <div
            className="
        rounded-2xl p-5
        bg-white dark:bg-neutral-900
        border border-slate-100 dark:border-gray-800
        shadow-sm
      "
        >
          <h3 className="mb-4 text-sm text-slate-600 dark:text-gray-400">
            {props.bio}
          </h3>

          <div className="space-y-4">
            <div className="text-sm text-slate-600 dark:text-gray-400">
          <span className="font-semibold text-slate-900 dark:text-gray-100">
            Đã tham gia
          </span>{" "}
              ngày {joinedAt ? formatDate(joinedAt) : "—"}
            </div>

            {!isLoading && !isError && topFollowing.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-gray-800">
                  <h4 className="mb-3 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                    Đang theo dõi
                  </h4>

                  <div className="flex gap-2">
                    {topFollowing.map((user) => (
                        <img
                            key={user.id}
                            src={user.image || "/user.png"}
                            onClick={() => router.push(`/users/${user.id}`)}
                            className="
                    h-8 w-8 rounded-full object-cover cursor-pointer
                    border border-slate-300 dark:border-gray-700
                  "
                        />
                    ))}
                  </div>
                </div>
            )}

            {isLoading && (
                <div className="pt-4 border-t border-slate-100 dark:border-gray-800">
                  <h4 className="mb-3 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                    Đang theo dõi
                  </h4>
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-800 animate-pulse"
                        />
                    ))}
                  </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-gray-800">
              <h4 className="mb-3 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                Chia sẻ hồ sơ
              </h4>

              <div className="flex gap-2">
                <FacebookShareButton url={profileUrl} quote={shareTitle}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b5998] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                    <Facebook className="h-4 w-4" />
                  </div>
                </FacebookShareButton>

                <TwitterShareButton url={profileUrl} title={shareTitle}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1da1f2] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                    <Twitter className="h-4 w-4" />
                  </div>
                </TwitterShareButton>

                <EmailShareButton url={profileUrl} subject={shareTitle}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f96a0e] text-white shadow-sm dark:ring-1 dark:ring-white/10 hover:opacity-90">
                    <Mail className="h-4 w-4" />
                  </div>
                </EmailShareButton>
              </div>
            </div>
          </div>
        </div>
      </>
  )
}

// Giữ nguyên SocialButton nếu bạn còn dùng chỗ khác
function SocialButton({ color, icon }: { color: string; icon: React.ReactNode }) {
  return (
      <button
          className={`${color} flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90`}
      >
        {icon}
      </button>
  )
}
