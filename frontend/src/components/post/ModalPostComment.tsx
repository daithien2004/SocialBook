// ModalPostComment.tsx
"use client";

import React, {Fragment, useState} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import { Post } from "@/src/features/posts/types/post.interface";
import ListComments from "@/src/components/comment/ListComments";
import {usePostCreateMutation} from "@/src/features/comments/api/commentApi";

interface ModalPostCommentProps {
    post: Post;
    isCommentOpen: boolean;
    closeCommentModal: () => void;
}

const ModalPostComment: React.FC<ModalPostCommentProps> = (props) => {
    const { post, isCommentOpen, closeCommentModal } = props;

    const [commentText, setCommentText] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [createComment, { isLoading: isPosting }] = usePostCreateMutation();

    const onSubmitComment = async () => {
        const content = commentText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType: "post",
                targetId: post.id,
                content,
                parentId: null,  // 👈 cấp 1
            }).unwrap();

            setCommentText("");
            setReloadKey((k) => k + 1); // cho ListComments refetch
        } catch (e) {
            console.error("Create comment failed:", e);
        }
    };

    return (
        <Transition appear show={isCommentOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-[9999]"
                onClose={closeCommentModal}
            >
                {/* Backdrop */}
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
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                        <img
                                            src={post.userAvatar}
                                            alt=""
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <Dialog.Title className="text-sm font-semibold">
                                                {post.userName}
                                            </Dialog.Title>
                                            <p className="text-xs text-gray-500">
                                                {post.bookTitle}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nội dung ngắn */}
                                    <div className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                                        {post.content}
                                    </div>

                                    {/* Danh sách comment */}
                                    <ListComments
                                        post={post}
                                        isCommentOpen={isCommentOpen}
                                        parentId={null}
                                        reloadKey={reloadKey}
                                    />

                                    {/* 🔻 ĐOẠN BẠN MUỐN ĐỂ NGOÀI LISTCOMMENTS */}
                                    <div className="px-4 py-3 border-t border-gray-100">
                                        {/* Nút like, comment, send */}
                                        <div className="flex items-center gap-4 mb-3">
                                            <Heart
                                                size={22}
                                                className="cursor-pointer hover:scale-110 transition"
                                            />
                                            <MessageCircle
                                                size={20}
                                                className="cursor-pointer hover:scale-110 transition"
                                            />
                                            <Send
                                                size={20}
                                                className="cursor-pointer hover:scale-110 transition"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {post.totalLikes ?? 0} lượt thích •{" "}
                                            {post.totalComments ?? 0} bình luận
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Thêm bình luận..."
                                                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                            />
                                            <button
                                                disabled={isPosting || !commentText.trim()}
                                                onClick={onSubmitComment}
                                                className="text-indigo-600 font-semibold cursor-pointer hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPosting ? "Đang đăng..." : "Đăng"}
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
    );
};

export default ModalPostComment;
