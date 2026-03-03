import { ApiProperty } from '@nestjs/swagger';
import { Post } from '@/domain/posts/entities/post.entity';

export class PostResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    imageUrls: string[];

    @ApiProperty()
    isFlagged: boolean;

    @ApiProperty({ required: false })
    moderationStatus?: string;

    @ApiProperty({ type: Object, required: false })
    user?: { id: string; username: string; image?: string };

    @ApiProperty({ type: Object, required: false })
    book?: { id: string; title: string; slug?: string };

    @ApiProperty({ required: false })
    likesCount?: number;

    @ApiProperty({ required: false })
    commentsCount?: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
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
