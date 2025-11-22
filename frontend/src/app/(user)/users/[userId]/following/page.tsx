import { UserCheck, UserPlus } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface User {
    name: string
    username: string
    avatar: string
    cover: string
    isFollowing: boolean
    stats: {
        works: number
        following: number
        followers: string
    }
}

const users: User[] = [
    {
        name: "Elizabeth Seibert",
        username: "@joecool123",
        avatar: "/fluffy-yellow-duckling.png",
        cover: "/book-cover-blue.jpg",
        isFollowing: true,
        stats: { works: 5, following: 79, followers: "62.2K" },
    },
    {
        name: "HoomanDoesCosplay",
        username: "@hooman_does_cosplay",
        avatar: "/cartoon-avatar.jpg",
        cover: "/harry-potter-street.jpg",
        isFollowing: true,
        stats: { works: 58, following: 14, followers: "677" },
    },
    {
        name: "hailcalla",
        username: "@hailcalla",
        avatar: "/snow-avatar.jpg",
        cover: "/snow-forest.jpg",
        isFollowing: true,
        stats: { works: 12, following: 21, followers: "423" },
    },
    {
        name: "Elizabeth Seibert",
        username: "@joecool123",
        avatar: "/fluffy-yellow-duckling.png",
        cover: "/book-cover-blue.jpg",
        isFollowing: true,
        stats: { works: 5, following: 79, followers: "62.2K" },
    },
    {
        name: "HoomanDoesCosplay",
        username: "@hooman_does_cosplay",
        avatar: "/cartoon-avatar.jpg",
        cover: "/harry-potter-street.jpg",
        isFollowing: true,
        stats: { works: 58, following: 14, followers: "677" },
    },
    {
        name: "hailcalla",
        username: "@hailcalla",
        avatar: "/snow-avatar.jpg",
        cover: "/snow-forest.jpg",
        isFollowing: true,
        stats: { works: 12, following: 21, followers: "423" },
    },
]

const FollowingPage = () => {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user, index) => (
                    <div
                        key={index}
                        className="group relative bg-white border border-neutral-100 shadow-sm transition-all duration-500 overflow-hidden flex flex-col"
                    >
                        {/* Cover Image */}
                        <div className="h-24 w-full relative bg-neutral-100 overflow-hidden">
                            <Image
                                src={user.cover || "/placeholder.svg"}
                                alt={`${user.name} cover`}
                                fill
                                className="object-cover transition-transform duration-700    grayscale-[20%] group-hover:grayscale-0"
                            />
                            <div className="absolute inset-0 bg-black/5 transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="px-3 pb-3 pt-12 relative flex-1 flex flex-col items-center text-center">
                            {/* Avatar - Floating */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                <div className="h-20 w-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-neutral-50">
                                    <Image
                                        src={user.avatar || "/placeholder.svg"}
                                        alt={user.name}
                                        width={80}
                                        height={80}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="space-y-1 mb-2">
                                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-neutral-700 transition-colors">
                                    {user.name}
                                </h3>
                                <p className="text-xs font-medium text-neutral-400">{user.username}</p>
                            </div>

                            {/* Action Button */}
                            <Button
                                className={`w-full rounded-md font-medium text-xs tracking-wide transition-all duration-300 ${
                                    user.isFollowing
                                        ? "bg-teal-700 text-white hover:bg-teal-600 shadow-lg shadow-neutral-900/20"
                                        : "bg-white border border-neutral-200 text-foreground hover:border-neutral-900"
                                }`}
                            >
                                {user.isFollowing ? (
                                    <>
                                        <UserCheck className="mr-2 h-3.5 w-3.5" />
                                        Đang theo dõi
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-3.5 w-3.5" />
                                        Theo dõi
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default  FollowingPage
