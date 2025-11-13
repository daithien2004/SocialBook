"use client"

import  React, {Fragment, useState} from "react"
import { Dialog, Transition } from "@headlessui/react";
import {Heart, MessageCircle, Send, X} from "lucide-react"
import {Post} from "@/src/features/posts/types/post.interface";
import {PostComment} from "@/src/features/posts/types/posCommentst.interface";

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({post}) => {
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
                <div className="border-t border-gray-200 space-y-1">

                    <div className="flex items-center justify-end gap-2">
                        <div className="text-xs text-gray-500 font-medium py-2">
                            {`${post.totalLikes ?? 0} likes`}
                        </div>
                        <div className="text-xs text-gray-500 font-medium py-2">
                            {`${post.totalComments ?? 0} comments`}
                        </div>
                    </div>

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
                </div>
            </div>

            <Transition appear show={isCommentOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[9999]" onClose={closeCommentModal}>
                    {/* Backdrop – click ra ngoài sẽ gọi onClose */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/70" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                {/* Panel */}
                                <Dialog.Panel className="bg-white w-[min(95vw,1000px)] h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex">
                                    {/* Nút đóng */}
                                    <button
                                        onClick={closeCommentModal}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-600"
                                        aria-label="Close"
                                    >
                                        <X size={20} />
                                    </button>

                                    {/* Trái: ảnh lớn */}
                                    <div className="hidden md:block md:w-[50%] bg-black">
                                        <img
                                            src={post.image[0]}
                                            alt="Post"
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    </div>

                                    {/* Phải: comment column */}
                                    <div className="w-full md:w-[50%] flex flex-col">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={post.userAvatar} alt="" className="w-8 h-8 rounded-full" />
                                            <div className="flex-1">
                                                <Dialog.Title className="text-sm font-semibold">
                                                    {post.userName}
                                                </Dialog.Title>
                                                <p className="text-xs text-gray-500">{post.bookTitle}</p>
                                            </div>
                                        </div>

                                        {/* Nội dung ngắn */}
                                        <div className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                                            {post.content}
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                            {post.comments?.length ? (
                                                post.comments.map((c: PostComment, i: number) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={c.userAvatar} alt="" className="w-7 h-7 rounded-full" />
                                                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                                                            <p className="text-sm">
                                                                <span className="font-semibold mr-2">{c.userName}</span>
                                                                {c.content}
                                                            </p>
                                                            <div className="flex gap-2 mt-1">
                                                                <p className="text-xs text-gray-500 ">{c.createdAt}</p>
                                                                <p className="text-xs text-gray-500 1">8 lượt thích</p>
                                                                <p className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2">Thích</p>
                                                                <p className="text-xs text-gray-500 cursor-pointer hover:underline underline-offset-2">Trả lời</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">Chưa có bình luận nào.</p>
                                            )}
                                        </div>

                                        {/* Actions + Input */}
                                        <div className="px-4 py-3">
                                            <div className="flex items-center gap-4 mb-3">
                                                <Heart size={22} className="cursor-pointer hover:scale-110 transition" />
                                                <MessageCircle size={20} className="cursor-pointer hover:scale-110 transition" />
                                                <Send size={20} className="cursor-pointer hover:scale-110 transition" />
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {post.totalLikes ?? 0} lượt thích • {post.totalComments ?? 0} bình luận
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Thêm bình luận..."
                                                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <button className="text-indigo-600 font-semibold hover:text-indigo-700">
                                                    Đăng
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}

export default PostCard
