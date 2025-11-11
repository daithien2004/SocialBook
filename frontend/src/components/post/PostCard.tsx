"use client"

import React from "react"
import { Heart, Reply, Flag } from "lucide-react"
import {Post} from "@/src/features/posts/types/post.interface";

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({post}) => {
    return (
        <div className="w-full bg-white rounded-3xl overflow-hidden shadow-lg">
            {/* Book Cover Section */}
            <div className="relative h-64 md:h-80 lg:h-135 overflow-hidden">
                <img
                    src={post.image[0]}
                    alt="Book Cover"
                    className="object-fill opacity-90 scale-160 translate-y-2"
                />
            </div>

            <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                    <img
                        src={post.userAvatar}
                        alt="Vinh"
                        className="w-8 h-8 rounded-full"
                    />
                    <h2 className="text-l text-gray-900">{`${post.userName} - ${post.bookTitle}`} </h2>
                </div>

                <p className="text-base md:text-lg text-gray-700">{post.content}</p>

                <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                    <button
                        className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition-colors group"
                    >
                        <Heart
                            size={20}
                            className={`transition-colors ${post.likedByCurrentUser ? "fill-red-500 text-red-500" : "group-hover:text-red-400"}`}
                        />
                        <span className="text-sm font-medium">{10 > 0 ? `10` : "Like this!"}</span>
                    </button>

                    <button
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <Reply size={20} />
                        <span className="text-sm font-medium">Reply</span>
                    </button>

                    <button
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <Flag size={20} />
                        <span className="text-sm font-medium">Report</span>
                    </button>
                    <span className="ml-auto text-sm text-gray-600 font-medium"></span>
                </div>
            </div>
        </div>
    )
}

export default PostCard
