'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useGetFlaggedPostsQuery, useApprovePostMutation, useRejectPostMutation } from '@/features/admin/api/moderationApi';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Check, X, AlertTriangle, User, BookOpen, Clock } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useModerationManagement } from '@/features/admin/hooks/moderation/useModerationManagement';

const ModerationQueuePage = () => {
    const {
        page,
        setPage,
        limit,
        posts,
        meta,
        isLoading,
        isFetching,
        isApproving,
        isRejecting,
        handleApprove,
        handleReject,
        openConfirm
    } = useModerationManagement();

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
                    <div className="grid gap-6">
                        {posts.map((post, index) => (
                            <Card
                                key={`${post.id}-${index}`}
                                className="overflow-hidden border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                            >
                                <CardHeader className="pb-4 bg-slate-50/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <div className="flex items-center gap-1.5 text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                    <User className="h-3.5 w-3.5 text-indigo-500" />
                                                    {post.user?.username || 'Ẩn danh'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                                    {post.book?.title || 'Sách'}
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="bg-rose-50 text-rose-600 border-rose-100 px-2 py-0.5 text-[10px] font-bold"
                                            >
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                LÝ DO: {post.moderationReason}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2">
                                            <Button
                                                onClick={() => openConfirm({
                                                    title: "Phê duyệt bài viết",
                                                    description: "Bạn có chắc chắn muốn phê duyệt bài viết này?",
                                                    confirmText: "Phê duyệt",
                                                    onConfirm: () => handleApprove(post.id)
                                                })}
                                                disabled={isApproving || isRejecting}
                                                className="bg-emerald-600 hover:bg-emerald-700 border text-white font-bold rounded h-9 px-4 text-sm"
                                            >
                                                Phê duyệt
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => openConfirm({
                                                    title: "Từ chối bài viết",
                                                    description: "Bạn có chắc chắn muốn từ chối và xóa bài viết này?",
                                                    confirmText: "Xóa",
                                                    variant: "destructive",
                                                    onConfirm: () => handleReject(post.id)
                                                })}
                                                disabled={isApproving || isRejecting}
                                                className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded h-9 px-4 text-sm"
                                            >
                                                Từ chối
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                                        <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                                        {post.imageUrls && post.imageUrls.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
                                                {post.imageUrls.map((url: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="relative aspect-square overflow-hidden rounded border border-slate-200"
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt={`Post image ${idx + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 50vw, 150px"
                                                            className="object-cover hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium pl-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Đăng lúc: {new Date(post.createdAt).toLocaleDateString('vi-VN')} {new Date(post.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500 font-medium">
                                Hiển thị <span className="text-gray-900 font-bold">{(page - 1) * limit + 1} – {Math.min(page * limit, meta.total)}</span> trong <span className="text-gray-900 font-bold">{meta.total}</span> bài viết
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-xl h-10 w-10 border-gray-200 hover:bg-gray-50"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </Button>
                                <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-900">
                                    Trang {page} / {meta.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page >= meta.totalPages}
                                    className="rounded-xl h-10 w-10 border-gray-200 hover:bg-gray-50"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ModerationQueuePage;
