"use client";

import type React from "react"
import { Facebook, Twitter, Mail } from "lucide-react"
import {useGetFollowingListQuery} from "@/src/features/follows/api/followApi";
import {useRouter} from "next/navigation";
import {formatDate} from "@/src/lib/utils";

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
        <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-sm font-normal text-gray-500 tracking-wider">
            {props.bio}
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

                  <div className="flex -space-x-2 gap-3">
                    {topFollowing.map((user) => (
                        <img
                            onClick={() => router.push(`/users/${user.id}`)}
                            key={user.id}
                            src={user.image || "/user.png"}
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
                {/* Facebook */}
                <FacebookShareButton url={profileUrl} quote={shareTitle}>
                  <div className="bg-[#3b5998] flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90">
                    <Facebook className="h-4 w-4" />
                  </div>
                </FacebookShareButton>

                {/* Twitter / X */}
                <TwitterShareButton url={profileUrl} title={shareTitle}>
                  <div className="bg-[#1da1f2] flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90">
                    <Twitter className="h-4 w-4" />
                  </div>
                </TwitterShareButton>

                {/* Pinterest */}
                <PinterestShareButton
                    url={profileUrl}
                    media={profileUrl} // tạm thời dùng chính URL, sau có avatar thì truyền URL ảnh
                    description={shareTitle}
                >
                  <div className="bg-[#bd081c] flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90">
                    <span className="font-serif font-bold text-sm">P</span>
                  </div>
                </PinterestShareButton>

                {/* Tumblr */}
                <TumblrShareButton
                    url={profileUrl}
                    title={shareTitle}
                    caption={shareTitle}
                >
                  <div className="bg-[#35465c] flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90">
                    <span className="font-bold text-sm">t</span>
                  </div>
                </TumblrShareButton>

                {/* Email */}
                <EmailShareButton
                    url={profileUrl}
                    subject={shareTitle}
                    body={`Xem hồ sơ của người dùng này: ${profileUrl}`}
                >
                  <div className="bg-[#f96a0e] flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90">
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
