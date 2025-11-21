"use client"

import { Ellipsis, Settings, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import {useSelector} from "react-redux";
import {RootState} from "@/src/store/store";

interface ProfileNavProps {
  isOwner: boolean
}

export function ProfileNav({ isOwner}: ProfileNavProps) {
  const segment = useSelectedLayoutSegment() // "posts" | "follow" | null
  const user = useSelector((state: RootState) => state.auth.user)
  const tabs = [
    { label: "Giới thiệu", href: `/user/${user?.id}`, segment: null },
    { label: "Bài đăng", href: `/user/${user?.id}/posts`, segment: "posts" },
    { label: "Đang theo dõi", href: `/user/${user?.id}/following`, segment: "following" },
  ]

  return (
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between md:flex-row md:h-14">
            {/* Navigation Tabs */}
            <nav className="flex w-full md:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = segment === tab.segment
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={[
                          "px-4 py-3 text-lg font-serif whitespace-nowrap border-b-4",
                          isActive
                              ? "border-[#ff9800] text-gray-1000"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:font-bold"
                        ].join(" ")}
                        aria-current={isActive ? "page" : undefined}
                    >
                      {tab.label}
                    </Link>
                )
              })}
            </nav>

            {/* Action Buttons */}
            <div className="py-2 md:py-0">
              {isOwner ? (
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
                        className="h-9 gap-2 text-gray-600 text-center text-base font-semibold bg-gray-50 border-gray-200 hover:bg-gray-100"
                    >
                      <UserPlus className="h-4 w-4" color="#e1a337" strokeWidth={3} />
                      Theo dõi
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
  )
}
