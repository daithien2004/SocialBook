import { Entity } from '@/shared/domain/entity.base';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { ChapterTitle } from '../value-objects/chapter-title.vo';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterOrderIndex } from '../value-objects/chapter-order-index.vo';
import { Paragraph } from '../value-objects/paragraph.vo';
import slugify from 'slugify';

export class Chapter extends Entity<ChapterId> {
    private constructor(
        id: ChapterId,
        private _title: ChapterTitle,
        private _slug: string,
        private _bookId: BookId,
        private _paragraphs: Paragraph[],
        private _viewsCount: number,
        private _orderIndex: ChapterOrderIndex,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
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
            title,
            slug,
            bookId,
            paragraphs,
            0,
            orderIndex
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
    }): Chapter {
        const paragraphs = props.paragraphs.map(p => Paragraph.create(p.id, p.content));
        
        return new Chapter(
            ChapterId.create(props.id),
            ChapterTitle.create(props.title),
            props.slug,
            BookId.create(props.bookId),
            paragraphs,
            props.viewsCount,
            ChapterOrderIndex.create(props.orderIndex),
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get title(): ChapterTitle {
        return this._title;
    }

    get slug(): string {
        return this._slug;
    }

    get bookId(): BookId {
        return this._bookId;
    }

    get paragraphs(): Paragraph[] {
        return [...this._paragraphs];
    }

    get viewsCount(): number {
        return this._viewsCount;
    }

    get orderIndex(): ChapterOrderIndex {
        return this._orderIndex;
    }

    // Business methods
    changeTitle(newTitle: string): void {
        const title = ChapterTitle.create(newTitle);
        this._title = title;
        this._slug = Chapter.generateSlug(newTitle);
        this.markAsUpdated();
    }

    changeBook(newBookId: string): void {
        this._bookId = BookId.create(newBookId);
        this.markAsUpdated();
    }

    updateOrderIndex(newOrderIndex: number): void {
        this._orderIndex = ChapterOrderIndex.create(newOrderIndex);
        this.markAsUpdated();
    }

    addParagraph(content: string): void {
        const paragraph = Paragraph.createWithoutId(content);
        this._paragraphs.push(paragraph);
        this.markAsUpdated();
    }

    updateParagraph(paragraphId: string, newContent: string): void {
        const paragraphIndex = this._paragraphs.findIndex(p => p.id === paragraphId);
        
        if (paragraphIndex === -1) {
            throw new Error('Paragraph not found');
        }

        this._paragraphs[paragraphIndex].updateContent(newContent);
        this.markAsUpdated();
    }

    removeParagraph(paragraphId: string): void {
        const paragraphIndex = this._paragraphs.findIndex(p => p.id === paragraphId);
        
        if (paragraphIndex === -1) {
            throw new Error('Paragraph not found');
        }

        if (this._paragraphs.length === 1) {
            throw new Error('Chapter must have at least one paragraph');
        }

        this._paragraphs.splice(paragraphIndex, 1);
        this.markAsUpdated();
    }

    reorderParagraphs(newOrder: string[]): void {
        const reorderedParagraphs: Paragraph[] = [];
        
        for (const id of newOrder) {
            const paragraph = this._paragraphs.find(p => p.id === id);
            if (!paragraph) {
                throw new Error(`Paragraph with ID ${id} not found`);
            }
            reorderedParagraphs.push(paragraph);
        }

        if (reorderedParagraphs.length !== this._paragraphs.length) {
            throw new Error('All paragraphs must be included in the reorder');
        }

        this._paragraphs = reorderedParagraphs;
        this.markAsUpdated();
    }

    incrementViews(): void {
        this._viewsCount += 1;
        this.markAsUpdated();
    }

    getWordCount(): number {
        return this._paragraphs.reduce((count, paragraph) => {
            return count + paragraph.content.split(/\s+/).filter(word => word.length > 0).length;
        }, 0);
    }

    getCharacterCount(): number {
        return this._paragraphs.reduce((count, paragraph) => {
            return count + paragraph.content.length;
        }, 0);
    }

    getContentPreview(maxLength: number = 200): string {
        const firstParagraph = this._paragraphs[0]?.content || '';
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
