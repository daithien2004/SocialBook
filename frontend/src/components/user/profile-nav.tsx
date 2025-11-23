"use client";

import { Ellipsis, Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSelectedLayoutSegment, useRouter } from "next/navigation";
import {
  useToggleFollowMutation,
  type FollowStateResponse,
} from "@/src/features/follows/api/followApi";
import { useState } from "react";

interface ProfileNavProps {
  profileUserId: string;
  initialFollowState: FollowStateResponse | null;
}

export function ProfileNav({ profileUserId, initialFollowState }: ProfileNavProps) {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();

  const [followState, setFollowState] = useState<FollowStateResponse | null>(
      initialFollowState
  );

  const [toggleFollow, { isLoading: isToggling }] = useToggleFollowMutation();

  const isAuthenticated = !!followState;
  const isOwner = followState?.isOwner === true;
  const isFollowing = followState?.isFollowing === true;

  const handleFollowClick = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      const updated = await toggleFollow(profileUserId).unwrap();
      setFollowState(updated);
    } catch (e: any) {
      console.error("Toggle follow failed:", e);

      if (e && typeof e === "object" && "status" in e && (e as any).status === 401) {
        router.push("/auth/login");
      }
    }
  };

  const tabs = [
    { label: "Giới thiệu", href: `/users/${profileUserId}`, segment: null },
    { label: "Bài đăng", href: `/users/${profileUserId}/posts`, segment: "posts" },
    { label: "Đang theo dõi", href: `/users/${profileUserId}/following`, segment: "following" },
  ];

  return (
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between md:flex-row md:h-14">
            {/* Navigation Tabs */}
            <nav className="flex w-full md:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive =
                    segment === tab.segment ||
                    (segment === null && tab.segment === null);

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={[
                          "px-4 py-3 text-lg font-serif whitespace-nowrap border-b-4",
                          isActive
                              ? "border-[#ff9800] text-gray-1000"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:font-bold",
                        ].join(" ")}
                        aria-current={isActive ? "page" : undefined}
                    >
                      {tab.label}
                    </Link>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="py-2 md:py-0">
              {isAuthenticated && isOwner ? (
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    Sửa Hồ Sơ
                  </Button>
              ) : (
                  <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFollowClick}
                        disabled={isToggling} // ❌ bỏ isLoading query, chỉ dùng isToggling
                        className="h-9 gap-2 text-gray-600 text-center text-base font-semibold bg-gray-50 border-gray-200 hover:bg-gray-100 disabled:opacity-60"
                    >
                      <UserPlus
                          className="h-4 w-4"
                          color={isFollowing ? "#4caf50" : "#e1a337"}
                          strokeWidth={3}
                      />
                      {isAuthenticated && isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-gray-600 text-base font-semibold bg-gray-50 border-gray-200 hover:bg-gray-100"
                    >
                      <Ellipsis color="#000000" strokeWidth={2} />
                    </Button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
