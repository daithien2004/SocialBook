"use client";

import type React from "react"
import Image from "next/image";
import {useGetFollowingListQuery, FollowingUser} from "@/features/follows/api/followApi";
import {useRouter} from "next/navigation";
import {formatDate} from "@/lib/utils";
import { MapPin, Paperclip } from 'lucide-react';
import { useProfileShare } from './hooks';

interface ProfileNavProps {
  profileUserId: string;
  bio: string | undefined;
  joinedAt: Date | undefined;
  location?: string;
  website?: string;
}

const EMPTY_FOLLOWING: FollowingUser[] = [];

export function ProfileSidebar(props : ProfileNavProps) {
  const {profileUserId, joinedAt, location, website} = props
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
        border border-border
        shadow-sm
      "
        >
          <h3 className="mb-4 text-sm text-muted-foreground">
            {props.bio}
          </h3>

          <div className="space-y-4">
          

            <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Đã tham gia
            </span>{" "}
                ngày {joinedAt ? formatDate(joinedAt) : "—"}
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{location}</span>
              </div>
            )}

            {website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
                >
                  {website}
                </a>
              </div>
            )}

            {!isLoading && !isError && topFollowing.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Đang theo dõi
                  </h4>

                  <div className="flex gap-2">
                    {topFollowing.map((userFollowing: FollowingUser) => (
                        <Image
                            key={userFollowing.id}
                            src={userFollowing.image || "/user.png"}
                            alt={userFollowing.username || "user"}
                            width={32}
                            height={32}
                            onClick={() => router.push(`/users/${userFollowing.targetId}`)}
                            className="
                    h-8 w-8 rounded-full object-cover cursor-pointer
                    border border-border
                  "
                        />
                    ))}
                  </div>
                </div>
            )}

            {isLoading && (
                <div className="pt-4 border-t border-border">
                  <h4 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
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

            <div className="pt-4 border-t border-border">
              <h4 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
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
