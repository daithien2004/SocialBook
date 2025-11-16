"use client"

import  React, {useState} from "react"
import {Heart, MessageCircle, Send} from "lucide-react"
import {Post} from "@/src/features/posts/types/post.interface";
import ModalPostComment from "@/src/components/post/ModalPostComment";

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = (props) => {
    const {post} = props;
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const openCommentModal = () => setIsCommentOpen(true);
    const closeCommentModal = () => setIsCommentOpen(false);
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
                <div className="border-t flex justify-between border-gray-200 mt-2">
                    <div className="flex items-center gap-4">
                        <button
                            className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition-colors group"
                        >
                            <Heart
                                size={22}
                                className={`transition-transform duration-200 group-hover:scale-110 ${
                                    post.likedByCurrentUser
                                        ? "fill-red-500 text-red-500"
                                        : "group-hover:text-red-400"
                                }`}
                            />
                        </button>
                        <button
                            onClick={openCommentModal}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <MessageCircle size={20} className="transition-transform duration-200 hover:scale-110"/>
                        </button>
                        <button
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <Send size={20} className="transition-transform duration-200 hover:scale-110 "/>
                        </button>

                        <span className="ml-auto text-sm text-gray-600 font-medium"></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 font-medium py-2">
                            {`${post.totalLikes ?? 0} likes`}
                        </div>
                        <div className="text-xs text-gray-500 font-medium py-2">
                            {`${post.totalComments ?? 0} comments`}
                        </div>
                    </div>
                </div>
            </div>
            <ModalPostComment post={post}
                              isCommentOpen={isCommentOpen}
                              closeCommentModal={closeCommentModal}/>
        </div>
    )
}

export default PostCard
