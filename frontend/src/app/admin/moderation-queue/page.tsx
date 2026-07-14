'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, ChevronLeft, ChevronRight, AlertTriangle, User, BookOpen, Clock, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import { useModerationManagement } from '@/features/admin/hooks/moderation/useModerationManagement';
import { useToxicWordsManagement } from '@/features/admin/hooks/moderation/useToxicWordsManagement';
import { ToxicWordModal } from '@/components/admin/moderation/ToxicWordModal';
import { formatDateTime } from '@/lib/utils';

const ModerationQueuePage = () => {
    const {
        page,
        setPage,
        limit,
        reason,
        setReason,
        posts,
        meta,
        selectedPostIds,
        toggleSelectPost,
        toggleSelectAll,
        isLoading,
        isFetching,
        isApproving,
        isRejecting,
        isBulkApproving,
        isBulkRejecting,
        handleApprove,
        handleReject,
        handleBulkApprove,
        handleBulkReject,
        handleBanUser,
        openConfirm
    } = useModerationManagement();

    const { handleAdd: handleAddToxic, isAdding: isAddingToxic } = useToxicWordsManagement();
    const [isToxicModalOpen, setIsToxicModalOpen] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [popoverPos, setPopoverPos] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 0 && text.length <= 100) {
                const range = selection?.getRangeAt(0);
                const rect = range?.getBoundingClientRect();
                if (rect) {
                    setPopoverPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                    });
                    setSelectedText(text);
                }
            } else {
                setPopoverPos(null);
                setSelectedText('');
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('#toxic-popover')) {
                setPopoverPos(null);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 rounded-lg relative">
            {popoverPos && selectedText && (
                <div 
                    id="toxic-popover"
                    className="fixed z-50 bg-slate-900 text-white px-3 py-2 rounded-md shadow-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors transform -translate-x-1/2 -translate-y-full"
                    style={{ left: popoverPos.x, top: popoverPos.y }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsToxicModalOpen(true);
                        setPopoverPos(null);
                    }}
                >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    Thêm &quot;{selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}&quot; vào danh sách thô tục
                </div>
            )}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kiểm Duyệt Nội Dung</h1>
                    <p className="text-gray-600">Quản lý bài viết vi phạm cần phê duyệt</p>
                </div>
                <div className="flex items-center gap-2 max-w-sm w-full">
                    <Input
                        placeholder="Lọc theo lý do (VD: Toxic, Spam, ...)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="bg-white"
                    />
                </div>
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
                    <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id="select-all" 
                                checked={selectedPostIds.length > 0 && selectedPostIds.length === posts.length}
                                onCheckedChange={toggleSelectAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Chọn tất cả trên trang này
                            </label>
                        </div>
                        {selectedPostIds.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-indigo-600 mr-2">
                                    Đã chọn {selectedPostIds.length} bài
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => openConfirm({
                                        title: "Phê duyệt hàng loạt",
                                        description: `Bạn có chắc chắn muốn phê duyệt ${selectedPostIds.length} bài viết đã chọn?`,
                                        confirmText: "Phê duyệt",
                                        onConfirm: handleBulkApprove
                                    })}
                                    disabled={isBulkApproving || isBulkRejecting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Phê duyệt
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openConfirm({
                                        title: "Từ chối hàng loạt",
                                        description: `Bạn có chắc chắn muốn từ chối và xóa ${selectedPostIds.length} bài viết đã chọn?`,
                                        confirmText: "Xóa",
                                        variant: "destructive",
                                        onConfirm: handleBulkReject
                                    })}
                                    disabled={isBulkApproving || isBulkRejecting}
                                >
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-6">
                        {posts.map((post, index) => (
                            <Card
                                key={`${post.id}-${index}`}
                                className="overflow-hidden border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                            >
                                <CardHeader className="pb-4 bg-slate-50/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Checkbox 
                                                    checked={selectedPostIds.includes(post.id)}
                                                    onCheckedChange={() => toggleSelectPost(post.id)}
                                                    className="mt-0.5"
                                                />
                                                <div 
                                                    className={`flex items-center gap-1.5 text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm ${post.user ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                                                    onClick={() => {
                                                        if (post.user) {
                                                            openConfirm({
                                                                title: "Cập nhật trạng thái người dùng",
                                                                description: `Bạn có chắc chắn muốn cấm/mở cấm người dùng ${post.user.username}?`,
                                                                confirmText: "Xác nhận",
                                                                variant: "destructive",
                                                                onConfirm: () => handleBanUser(post.user.id)
                                                            });
                                                        }
                                                    }}
                                                    title={post.user ? "Nhấn để cấm/mở cấm người dùng này" : undefined}
                                                >
                                                    <User className="h-3.5 w-3.5 text-indigo-500" />
                                                    {post.user?.username || 'Ẩn danh'}
                                                    {(post.user?.violationCount && post.user.violationCount > 0) ? (
                                                        <span className="ml-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                                                            {post.user.violationCount} vi phạm
                                                        </span>
                                                    ) : null}
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
                                        <span>Đăng lúc: {formatDateTime(post.createdAt)}</span>
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
            <ToxicWordModal
                isOpen={isToxicModalOpen}
                onClose={() => setIsToxicModalOpen(false)}
                onSubmit={handleAddToxic}
                isSubmitting={isAddingToxic}
                initialWord={selectedText}
            />
        </div>
    );
};

export default ModerationQueuePage;
