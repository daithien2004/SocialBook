"use client";

import type React from "react"
import Image from "next/image";
import {useGetFollowingListQuery, FollowingUser} from "@/features/follows/api/followApi";
import {useRouter} from "next/navigation";
import {formatDate} from "@/lib/utils";
import { useProfileShare } from './hooks';

interface ProfileNavProps {
  profileUserId: string;
  bio: string | undefined
  joinedAt: Date | undefined;
}

const EMPTY_FOLLOWING: FollowingUser[] = [];

export function ProfileSidebar(props : ProfileNavProps) {
  const {profileUserId, joinedAt} = props
  const {
    data: following = EMPTY_FOLLOWING,
    isLoading,
    isError,
  } = useGetFollowingListQuery(profileUserId, {
    skip: !profileUserId,
  });
  const router = useRouter();
  const topFollowing = following.slice(0, 7);
  const { shareButtons } = useProfileShare({ userId: profileUserId });

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
                        <Image
                            key={user.id}
                            src={user.image || "/user.png"}
                            alt={user.username || "user"}
                            width={32}
                            height={32}
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
                {shareButtons.map((share) => share.button)}
              </div>
            </div>
          </div>
        </div>
      </>
  )
}
