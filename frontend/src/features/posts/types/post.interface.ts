import {PostComment} from "@/src/features/posts/types/posCommentst.interface";

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    bookId: string;
    bookTitle: string;
    content: string;
    image: string[];
    isDelete: boolean;
    createdAt: Date;
    totalLikes?: number;
    totalComments?: number;
    likedByCurrentUser?: boolean;
    comments?: PostComment[];
}
