'use client';

import { useState } from 'react';
import { useGetFlaggedPostsQuery, useApprovePostMutation, useRejectPostMutation } from '@/features/admin/api/moderationApi';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Check, X, AlertTriangle, User, BookOpen } from 'lucide-react';
import { ConfirmDelete } from '@/components/admin/ConfirmDelete';

const ModerationQueuePage = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isFetching, refetch } = useGetFlaggedPostsQuery({ page, limit });
    const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
    const [rejectPost, { isLoading: isRejecting }] = useRejectPostMutation();

    const posts = data?.items || [];
    const meta = data?.meta;

    return (
        <div className="min-h-screen bg-gray-50 rounded-lg">
            <div className="py-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Kiểm Duyệt Nội Dung</h1>
                <p className="text-gray-600">Quản lý bài viết vi phạm cần phê duyệt</p>
            </div>

            {/* Loading */}
            {(isLoading || isFetching) && (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            )}

            {/* Empty State */}
            {!(isLoading || isFetching) && posts.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg text-gray-600">Không có bài viết nào cần kiểm duyệt</p>
                </div>
            )}

            {/* Posts List */}
            {!(isLoading || isFetching) && posts.length > 0 && (
                <>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white rounded-xl shadow-sm border-l-4 border-l-yellow-500 border border-gray-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-gray-500" />
                                                <span className="font-semibold text-gray-900">{post.userId.username}</span>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                    {post.userId.email}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{post.bookId.title}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium mt-2">
                                                <AlertTriangle className="h-3 w-3" />
                                                {post.moderationReason}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <ConfirmDelete
                                                title="Phê duyệt bài viết"
                                                description="Bạn có chắc chắn muốn phê duyệt bài viết này?"
                                                onConfirm={async () => {
                                                    try {
                                                        await approvePost(post.id).unwrap();
                                                        toast.success('Bài viết đã được phê duyệt');
                                                        refetch();
                                                    } catch (error: any) {
                                                        toast.error(error?.message || 'Phê duyệt thất bại');
                                                    }
                                                }}
                                                okText="Phê duyệt"
                                            >
                                                <button
                                                    disabled={isApproving || isRejecting}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Phê duyệt
                                                </button>
                                            </ConfirmDelete>

                                            <ConfirmDelete
                                                title="Từ chối bài viết"
                                                description="Bạn có chắc chắn muốn từ chối và xóa bài viết này?"
                                                onConfirm={async () => {
                                                    try {
                                                        await rejectPost(post.id).unwrap();
                                                        toast.success('Bài viết đã bị từ chối và xóa');
                                                        refetch();
                                                    } catch (error: any) {
                                                        toast.error(error?.message || 'Từ chối thất bại');
                                                    }
                                                }}
                                                okText="Xóa"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <button
                                                    disabled={isApproving || isRejecting}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Từ chối
                                                </button>
                                            </ConfirmDelete>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                                        {post.imageUrls && post.imageUrls.length > 0 && (
                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                {post.imageUrls.map((url: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt={`Post image ${idx + 1}`}
                                                        className="rounded-md object-cover aspect-square border border-gray-200"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">
                                        Đăng lúc: {new Date(post.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, meta.total)} trong {meta.total} bài viết
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-medium text-sm">Trang {page} / {meta.totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page >= meta.totalPages}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ModerationQueuePage;
