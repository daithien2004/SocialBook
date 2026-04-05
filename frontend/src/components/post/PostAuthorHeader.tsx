'use client';

import { Post } from '@/features/posts/types/post.interface';
import { UserAvatarWithInfo } from '@/components/common/UserAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface PostAuthorHeaderProps {
    post: Post;
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

export function PostAuthorHeader({
    post,
    isOwner,
    onEdit,
    onDelete,
}: PostAuthorHeaderProps) {
    const route = useRouter();

    const navigateToUser = useCallback(() => {
        if (post?.user?.id) {
            route.push(`users/${post.user.id}`);
        }
    }, [route, post?.user?.id]);

    const createdDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <div className="flex flex-row items-center justify-between space-y-0">
            <UserAvatarWithInfo
                src={post.user?.image}
                name={post.user?.username}
                displayName={post.user?.username || post.user?.email || 'Người dùng ẩn danh'}
                subtitle={createdDate}
                onClick={post?.user?.id ? navigateToUser : undefined}
            />

            {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100 dark:hover:bg-gray-800" aria-label="Tùy chọn bài viết">
                            <MoreVertical className="w-4 h-4 text-slate-500 dark:border-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" />
                            <span>Chỉnh sửa bài viết</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span>Xóa bài viết</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
