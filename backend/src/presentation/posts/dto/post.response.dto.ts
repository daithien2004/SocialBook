import { Post } from '@/domain/posts/entities/post.entity';

export class PostResponseDto {
    id: string;

    content: string;

    imageUrls: string[];

    isFlagged: boolean;

    moderationStatus?: string;

    user?: { id: string; username: string; image?: string };

    book?: { id: string; title: string; slug?: string };

    likesCount?: number;

    commentsCount?: number;

    createdAt: Date;

    updatedAt: Date;


    constructor(post: Post) {
        this.id = post.id.toString();
        this.content = post.content;
        this.imageUrls = post.imageUrls || [];
        this.isFlagged = post.isFlagged || false;
        this.moderationStatus = post.moderationStatus;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;

        // Handle populated author
        if (post.author) {
            this.user = {
                id: post.author.id,
                username: post.author.username,
                image: post.author.image,
            };
        }

        // Handle populated book
        if (post.book) {
            this.book = {
                id: post.book.id,
                title: post.book.title,
            };
        }
    }

    static fromDomain(post: Post): PostResponseDto {
        return new PostResponseDto(post);
    }

    static fromArray(posts: Post[]): PostResponseDto[] {
        return posts.map(post => new PostResponseDto(post));
    }
}
