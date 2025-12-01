import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { Book } from '../books/schemas/book.schema';
import { Chapter } from '../chapters/schemas/chapter.schema';
import { Author } from '../authors/schemas/author.schema';
import { createBookDocument } from '../search/utils/text-preprocessing';
import { createChapterDocument, createAuthorDocument } from '../search/utils/content-preprocessing';

@Injectable()
export class ChromaService implements OnModuleInit {
    private readonly logger = new Logger(ChromaService.name);
    private vectorStore: Chroma;
    private embeddings: GoogleGenerativeAIEmbeddings;
    private isInitialized = false;

    constructor(
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
        @InjectModel(Author.name) private authorModel: Model<Author>,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        try {
            // Initialize embeddings (supports Vietnamese natively)
            this.embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: this.configService.get('GOOGLE_API_KEY'),
                model: 'text-embedding-004',
            });

            // Initialize Chroma vector store
            this.vectorStore = new Chroma(this.embeddings, {
                collectionName: this.configService.get(
                    'CHROMA_COLLECTION',
                    'socialbook_books',
                ),
                url: this.configService.get('CHROMA_URL', 'http://localhost:8000'),
            });

            this.isInitialized = true;
            this.logger.log('✅ Chroma vector store initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize Chroma:', error);
            this.isInitialized = false;
        }
    }

    getVectorStore(): Chroma {
        if (!this.isInitialized) {
            throw new Error('Vector store not initialized');
        }
        return this.vectorStore;
    }

    // ========== BOOK INDEXING ========== //

    /**
     * Index a single book into vector store
     */
    async indexBook(bookId: string) {
        const book = await this.bookModel
            .findById(bookId)
            .populate('authorId', 'name')
            .populate('genres', 'name')
            .lean();

        if (!book) {
            throw new Error(`Book ${bookId} not found`);
        }

        const documentText = createBookDocument(book);

        const document = new Document({
            pageContent: documentText,
            metadata: {
                type: 'book',
                bookId: book._id.toString(),
                title: book.title,
                slug: book.slug,
                author: (book.authorId as any)?.name || 'Unknown',
                genres: book.genres?.map((g: any) => g.name).join(', ') || '',
                createdAt: book.createdAt ? new Date(book.createdAt as any).toISOString() : new Date().toISOString(),
            },
        });

        await this.vectorStore.addDocuments([document]);
        this.logger.log(`✅ Indexed book: ${book.title}`);

        return { success: true, bookId: book._id };
    }

    /**
     * Bulk reindex all books
     */
    async reindexAllBooks() {
        const books = await this.bookModel
            .find({ status: 'published' })
            .populate('authorId', 'name')
            .populate('genres', 'name')
            .lean();

        this.logger.log(`📚 Starting bulk indexing for ${books.length} books...`);

        const documents = books.map((book) => {
            const documentText = createBookDocument(book);

            return new Document({
                pageContent: documentText,
                metadata: {
                    type: 'book',
                    bookId: book._id.toString(),
                    title: book.title,
                    slug: book.slug,
                    author: (book.authorId as any)?.name || 'Unknown',
                    genres: book.genres?.map((g: any) => g.name).join(', ') || '',
                    createdAt: book.createdAt ? new Date(book.createdAt as any).toISOString() : new Date().toISOString(),
                },
            });
        });

        if (documents.length > 0) {
            await this.vectorStore.addDocuments(documents);
        }

        this.logger.log(`✅ Successfully indexed ${books.length} books`);

        return {
            success: true,
            totalIndexed: books.length,
        };
    }

    // ========== CHAPTER INDEXING ========== //

    /**
     * Index a single chapter
     */
    async indexChapter(chapterId: string) {
        const chapter = await this.chapterModel
            .findById(chapterId)
            .populate('bookId', 'title slug')
            .lean();

        if (!chapter) throw new Error('Chapter not found');

        const documentChunks = createChapterDocument(chapter);

        const documents = documentChunks.map((chunk, index) => {
            return new Document({
                pageContent: chunk,
                metadata: {
                    type: 'chapter',
                    chapterId: chapter._id.toString(),
                    chapterTitle: chapter.title,
                    chapterSlug: chapter.slug,
                    bookId: (chapter.bookId as any)._id.toString(),
                    bookTitle: (chapter.bookId as any).title,
                    bookSlug: (chapter.bookId as any).slug,
                    orderIndex: chapter.orderIndex,
                    chunkIndex: index,
                    createdAt: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : new Date().toISOString(),
                },
            });
        });

        await this.vectorStore.addDocuments(documents);
        this.logger.log(`✅ Indexed chapter: ${chapter.title} (${documents.length} chunks)`);

        return { success: true, chapterId: chapter._id, chunks: documents.length };
    }

    /**
     * Bulk index all chapters
     */
    async reindexAllChapters() {
        const chapters = await this.chapterModel
            .find()
            .populate('bookId', 'title slug')
            .lean();

        this.logger.log(`📚 Indexing ${chapters.length} chapters...`);

        const documents: Document[] = [];

        for (const chapter of chapters) {
            const chunks = createChapterDocument(chapter);

            chunks.forEach((chunk, index) => {
                documents.push(new Document({
                    pageContent: chunk,
                    metadata: {
                        type: 'chapter',
                        chapterId: chapter._id.toString(),
                        chapterTitle: chapter.title,
                        chapterSlug: chapter.slug,
                        bookId: (chapter.bookId as any)._id.toString(),
                        bookTitle: (chapter.bookId as any).title,
                        bookSlug: (chapter.bookId as any).slug,
                        orderIndex: chapter.orderIndex,
                        chunkIndex: index,
                        createdAt: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : new Date().toISOString(),
                    },
                }));
            });
        }

        if (documents.length > 0) {
            await this.vectorStore.addDocuments(documents);
        }

        this.logger.log(`✅ Indexed ${chapters.length} chapters`);

        return {
            success: true,
            totalIndexed: chapters.length,
        };
    }

    // ========== AUTHOR INDEXING ========== //

    /**
     * Index a single author
     */
    async indexAuthor(authorId: string) {
        const author = await this.authorModel.findById(authorId).lean();

        if (!author) throw new Error('Author not found');

        const documentText = createAuthorDocument(author);

        const document = new Document({
            pageContent: documentText,
            metadata: {
                type: 'author',
                authorId: author._id.toString(),
                authorName: author.name,
                photoUrl: author.photoUrl || '',
                createdAt: new Date().toISOString(),
            },
        });

        await this.vectorStore.addDocuments([document]);
        this.logger.log(`✅ Indexed author: ${author.name}`);

        return { success: true, authorId: author._id };
    }

    /**
     * Bulk index all authors
     */
    async reindexAllAuthors() {
        const authors = await this.authorModel.find().lean();

        this.logger.log(`👤 Indexing ${authors.length} authors...`);

        const documents = authors.map(author => {
            const documentText = createAuthorDocument(author);

            return new Document({
                pageContent: documentText,
                metadata: {
                    type: 'author',
                    authorId: author._id.toString(),
                    authorName: author.name,
                    photoUrl: author.photoUrl || '',
                    createdAt: new Date().toISOString(),
                },
            });
        });

        if (documents.length > 0) {
            await this.vectorStore.addDocuments(documents);
        }

        this.logger.log(`✅ Indexed ${authors.length} authors`);

        return {
            success: true,
            totalIndexed: authors.length,
        };
    }

    // ========== UTILS ========== //

    /**
     * Clear all documents from vector store
     */
    async clearCollection() {
        try {
            // Get all books from DB to know which IDs to delete
            const books = await this.bookModel.find().select('_id').lean();
            const chapters = await this.chapterModel.find().select('_id').lean();
            const authors = await this.authorModel.find().select('_id').lean();

            const allIds = [
                ...books.map(b => ({ bookId: b._id.toString() })),
                ...chapters.map(c => ({ chapterId: c._id.toString() })),
                ...authors.map(a => ({ authorId: a._id.toString() }))
            ];

            if (allIds.length === 0) {
                return { success: true, message: 'No documents in DB to clear', count: 0 };
            }

            // Let's try to delete by type if we can.
            await this.vectorStore.delete({ filter: { type: 'book' } }).catch(() => { });
            await this.vectorStore.delete({ filter: { type: 'chapter' } }).catch(() => { });
            await this.vectorStore.delete({ filter: { type: 'author' } }).catch(() => { });

            this.logger.log(`🗑️ Cleared collection`);

            return {
                success: true,
                message: 'Collection cleared (best effort)',
            };
        } catch (error) {
            this.logger.error('Failed to clear collection:', error);
            throw error;
        }
    }

    /**
     * Get collection stats
     */
    async getCollectionStats() {
        return {
            collectionName: this.configService.get('CHROMA_COLLECTION'),
            isInitialized: this.isInitialized,
        };
    }
}
