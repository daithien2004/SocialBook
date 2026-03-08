import { Entity } from '@/shared/domain/entity.base';
import slugify from 'slugify';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { ChapterOrderIndex } from '../value-objects/chapter-order-index.vo';
import { ChapterTitle } from '../value-objects/chapter-title.vo';
import { Paragraph } from '../value-objects/paragraph.vo';

export interface ChapterProps {
    title: ChapterTitle;
    slug: string;
    bookId: BookId;
    paragraphs: Paragraph[];
    viewsCount: number;
    orderIndex: ChapterOrderIndex;
    ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    audioUrl?: string;
}

export class Chapter extends Entity<ChapterId> {
    private _props: ChapterProps;

    private constructor(id: ChapterId, props: ChapterProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: ChapterId;
        title: string;
        bookId: string;
        paragraphs: Array<{ id?: string; content: string }>;
        orderIndex: number;
    }): Chapter {
        const title = ChapterTitle.create(props.title);
        const slug = Chapter.generateSlug(props.title);
        const bookId = BookId.create(props.bookId);
        const orderIndex = ChapterOrderIndex.create(props.orderIndex);

        const paragraphs = props.paragraphs.map(p =>
            p.id ? Paragraph.create(p.id, p.content) : Paragraph.createWithoutId(p.content)
        );

        if (paragraphs.length === 0) {
            throw new Error('Chapter must have at least one paragraph');
        }

        return new Chapter(
            props.id,
            {
                title,
                slug,
                bookId,
                paragraphs,
                viewsCount: 0,
                orderIndex,
                ttsStatus: undefined,
                audioUrl: undefined
            }
        );
    }

    static reconstitute(props: {
        id: string;
        title: string;
        slug: string;
        bookId: string;
        paragraphs: Array<{ id: string; content: string }>;
        viewsCount: number;
        orderIndex: number;
        createdAt: Date;
        updatedAt: Date;
        ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
        audioUrl?: string;
    }): Chapter {
        const paragraphs = props.paragraphs.map(p => Paragraph.create(p.id, p.content));

        return new Chapter(
            ChapterId.create(props.id),
            {
                title: ChapterTitle.create(props.title),
                slug: props.slug,
                bookId: BookId.create(props.bookId),
                paragraphs,
                viewsCount: props.viewsCount,
                orderIndex: ChapterOrderIndex.create(props.orderIndex),
                ttsStatus: props.ttsStatus,
                audioUrl: props.audioUrl
            },
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get title(): ChapterTitle { return this._props.title; }
    get slug(): string { return this._props.slug; }
    get bookId(): BookId { return this._props.bookId; }
    get paragraphs(): Paragraph[] { return [...this._props.paragraphs]; }
    get viewsCount(): number { return this._props.viewsCount; }
    get orderIndex(): ChapterOrderIndex { return this._props.orderIndex; }
    get ttsStatus(): 'pending' | 'processing' | 'completed' | 'failed' | undefined { return this._props.ttsStatus; }
    get audioUrl(): string | undefined { return this._props.audioUrl; }

    // Business methods
    changeTitle(newTitle: string): void {
        const title = ChapterTitle.create(newTitle);
        this._props.title = title;
        this._props.slug = Chapter.generateSlug(newTitle);
        this.markAsUpdated();
    }

    changeBook(newBookId: string): void {
        this._props.bookId = BookId.create(newBookId);
        this.markAsUpdated();
    }

    updateOrderIndex(newOrderIndex: number): void {
        this._props.orderIndex = ChapterOrderIndex.create(newOrderIndex);
        this.markAsUpdated();
    }

    addParagraph(content: string): void {
        const paragraph = Paragraph.createWithoutId(content);
        this._props.paragraphs.push(paragraph);
        this.markAsUpdated();
    }

    updateParagraph(paragraphId: string, newContent: string): void {
        const paragraphIndex = this._props.paragraphs.findIndex(p => p.id === paragraphId);

        if (paragraphIndex === -1) {
            throw new Error('Paragraph not found');
        }

        this._props.paragraphs[paragraphIndex].updateContent(newContent);
        this.markAsUpdated();
    }

    removeParagraph(paragraphId: string): void {
        const paragraphIndex = this._props.paragraphs.findIndex(p => p.id === paragraphId);

        if (paragraphIndex === -1) {
            throw new Error('Paragraph not found');
        }

        if (this._props.paragraphs.length === 1) {
            throw new Error('Chapter must have at least one paragraph');
        }

        this._props.paragraphs.splice(paragraphIndex, 1);
        this.markAsUpdated();
    }

    reorderParagraphs(newOrder: string[]): void {
        const reorderedParagraphs: Paragraph[] = [];

        for (const id of newOrder) {
            const paragraph = this._props.paragraphs.find(p => p.id === id);
            if (!paragraph) {
                throw new Error(`Paragraph with ID ${id} not found`);
            }
            reorderedParagraphs.push(paragraph);
        }

        if (reorderedParagraphs.length !== this._props.paragraphs.length) {
            throw new Error('All paragraphs must be included in the reorder');
        }

        this._props.paragraphs = reorderedParagraphs;
        this.markAsUpdated();
    }

    incrementViews(): void {
        this._props.viewsCount += 1;
        this.markAsUpdated();
    }

    getCharacterCount(): number {
        return this._props.paragraphs.reduce((count, paragraph) => {
            return count + paragraph.content.length;
        }, 0);
    }

    getContentPreview(maxLength: number = 200): string {
        const firstParagraph = this._props.paragraphs[0]?.content || '';
        if (firstParagraph.length <= maxLength) {
            return firstParagraph;
        }
        return firstParagraph.substring(0, maxLength) + '...';
    }

    private static generateSlug(title: string): string {
        return slugify(title, {
            lower: true,
            strict: true,
            locale: 'vi'
        });
    }
}
