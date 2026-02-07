import { PostDocument } from '../infrastructure/schemas/post.schema';

const toIdString = (id: any): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
};

export class PostModal {
    id: string;
    content: string;
    imageUrls: string[];
    isFlagged: boolean;
    moderationStatus?: string;
    user?: { id: string; username: string; image?: string };
    book?: { id: string; title: string; slug: string };
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(post: PostDocument | any) {
        this.id = toIdString(post._id);
        this.content = post.content;
        this.imageUrls = post.imageUrls || [];
        this.isFlagged = post.isFlagged || false;
        this.moderationStatus = post.moderationStatus;
        this.likesCount = post.likesCount;
        this.commentsCount = post.commentsCount;
        this.isLiked = post.isLiked;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;

        // Handle populated user
        if (post.userId && typeof post.userId === 'object' && post.userId.username) {
            this.user = {
                id: toIdString(post.userId._id),
                username: post.userId.username,
                image: post.userId.image,
            };
        }

        // Handle populated book
        if (post.bookId && typeof post.bookId === 'object' && post.bookId.title) {
            this.book = {
                id: toIdString(post.bookId._id),
                title: post.bookId.title,
                slug: post.bookId.slug,
            };
        }
    }

    static fromArray(posts: (PostDocument | any)[]): PostModal[] {
        return posts.map(post => new PostModal(post));
    }
}
