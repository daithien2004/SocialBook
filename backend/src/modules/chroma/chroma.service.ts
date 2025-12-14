import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
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

            // Initialize Chat Model for Summarization (Semantic Enrichment)
            // Using gemini-1.5-flash for 1M token context window and speed
            this.chatModel = new ChatGoogleGenerativeAI({
                apiKey: this.configService.get('GOOGLE_API_KEY'),
                model: 'gemini-2.5-flash',
                maxOutputTokens: 1024,
                temperature: 0.3, // Low temperature for factual extraction
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

    private chatModel: ChatGoogleGenerativeAI;

    // tóm tắt nội dung để tìm kiếm
    private async generateChapterSummary(content: string, bookTitle: string, chapterTitle: string): Promise<string> {
        try {
            if (!content || content.length < 50) return ''; // Too short to summarize

            // Prompt designed to extract IMPLICIT details and KEY ENTITIES
            const prompt = `
Bạn là một trợ lý AI chuyên tóm tắt tiểu thuyết để phục vụ tìm kiếm.
Hãy đọc nội dung chương truyện dưới đây và tạo một bản "Tóm tắt Chuyên sâu" (Dense Summary) bằng tiếng Việt.

**Thông tin:**
- Sách: ${bookTitle}
- Chương: ${chapterTitle}

**Yêu cầu quan trọng:**
1. Tóm tắt nội dung chính của chương.
2. **TRÍCH XUẤT ĐẶC BIỆT**: Liệt kê rõ ràng các đặc điểm nhận dạng của nhân vật (ví dụ: vết sẹo, màu mắt, vũ khí), các đồ vật quan trọng, các chiêu thức/phép thuật xuất hiện.
3. Nếu có chi tiết nào KHÔNG được nói rõ nhưng có thể suy luận (ví dụ: "vết sẹo hình tia chớp" của Harry Potter), hãy nhắc đến nó để bổ sung ngữ cảnh.
4. Giữ nguyên các danh từ riêng.

**Nội dung chương:**
"${content.substring(0, 30000)}..." (cắt bớt nếu quá dài, nhưng Flash chịu được 1M token)

**BẢN TÓM TẮT:**
`;
            const response = await this.chatModel.invoke(prompt);
            const summary = response.content.toString();
            return summary;
        } catch (e) {
            this.logger.warn(`⚠️ Failed to generate summary for ${chapterTitle}: ${e.message}`);
            return '';
        }
    }

    /**
     * Helper to run tasks with concurrency limit
     */
    private async runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
        const queue = [...items];
        const workers = Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (item !== undefined) {
                    try {
                        await fn(item);
                    } catch (error) {
                        this.logger.error(`Error in concurrent task: ${error.message}`);
                    }
                }
            }
        });
        await Promise.all(workers);
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
     * Bulk reindex all books with concurrency
     */
    async reindexAllBooks() {
        const BATCH_SIZE = 200;
        const CONCURRENCY = 5;
        const totalBooks = await this.bookModel.countDocuments({ status: 'published' });

        this.logger.log(`📚 Found ${totalBooks} books. Starting parallel indexing (Concurrency: ${CONCURRENCY})...`);

        const batches: number[] = [];
        for (let i = 0; i < totalBooks; i += BATCH_SIZE) {
            batches.push(i);
        }

        let processedCount = 0;

        await this.runWithConcurrency(batches, CONCURRENCY, async (skip) => {
            const books = await this.bookModel
                .find({ status: 'published' })
                .populate('authorId', 'name')
                .populate('genres', 'name')
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean();

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

            processedCount += books.length;
            this.logger.log(`⏳ Indexed ${processedCount}/${totalBooks} books...`);
        });

        this.logger.log(`✅ Successfully indexed ${totalBooks} books`);

        return {
            success: true,
            totalIndexed: totalBooks,
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

        // 1. Create standard chunks
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

        // 2. Generate and Index SUMMARY (Semantic Enrichment)
        // Combine all paragraphs for summarization
        const fullContent = (chapter.paragraphs || [])
            .map((p: any) => p.content || '')
            .join(' ');

        const summary = await this.generateChapterSummary(
            fullContent,
            (chapter.bookId as any).title,
            chapter.title
        );

        if (summary) {
            const summaryDoc = new Document({
                pageContent: `[TÓM TẮT] ${summary}`, // Prefix to indicate it's a summary
                metadata: {
                    type: 'chapter_summary', // NEW TYPE
                    chapterId: chapter._id.toString(),
                    chapterTitle: chapter.title,
                    chapterSlug: chapter.slug,
                    bookId: (chapter.bookId as any)._id.toString(),
                    bookTitle: (chapter.bookId as any).title,
                    bookSlug: (chapter.bookId as any).slug,
                    orderIndex: chapter.orderIndex,
                    chunkIndex: -1, // Use -1 to indicate it's not a standard chunk
                    createdAt: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : new Date().toISOString(),
                },
            });
            documents.push(summaryDoc); // Add summary to the list of docs to index
            this.logger.log(`✨ Generated summary for chapter: ${chapter.title}`);
        }

        await this.vectorStore.addDocuments(documents);
        this.logger.log(`✅ Indexed chapter: ${chapter.title} (${documents.length} chunks + summary)`);

        return { success: true, chapterId: chapter._id, chunks: documents.length };
    }

    /**
     * Helper to sleep (prevent rate limiting)
     */
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async reindexAllChapters() {
        const BATCH_SIZE = 1; // Process 1 by 1 for Free Tier (Safety check)
        const CONCURRENCY = 1; // Strictly sequential to avoid 429 errors
        const totalChapters = await this.chapterModel.countDocuments();

        this.logger.log(`📚 Found ${totalChapters} chapters. Starting SEQUENTIAL indexing to respect API Limits...`);

        const batches: number[] = [];
        for (let i = 0; i < totalChapters; i += BATCH_SIZE) {
            batches.push(i);
        }

        let processedCount = 0;

        await this.runWithConcurrency(batches, CONCURRENCY, async (skip) => {
            const chapters = await this.chapterModel
                .find()
                .populate('bookId', 'title slug')
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean();

            const documents: Document[] = [];

            for (const chapter of chapters) {
                try {
                    // Skip if bookId is missing or invalid (populated field)
                    if (!chapter.bookId || !(chapter.bookId as any)._id) continue;

                    // 1. Standard Chunks
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

                    // 2. Semantic Summary (With Rate Limiting)
                    const fullContent = (chapter.paragraphs || [])
                        .map((p: any) => p.content || '')
                        .join(' ');

                    // Add delay BEFORE request to safeguard rate limit
                    // Free tier assumes ~15 RPM => 4 seconds per request
                    await this.sleep(4000);

                    const summary = await this.generateChapterSummary(
                        fullContent,
                        (chapter.bookId as any).title,
                        chapter.title
                    );

                    if (summary) {
                        documents.push(new Document({
                            pageContent: `[TÓM TẮT] ${summary}`,
                            metadata: {
                                type: 'chapter_summary',
                                chapterId: chapter._id.toString(),
                                chapterTitle: chapter.title,
                                chapterSlug: chapter.slug,
                                bookId: (chapter.bookId as any)._id.toString(),
                                bookTitle: (chapter.bookId as any).title,
                                bookSlug: (chapter.bookId as any).slug,
                                orderIndex: chapter.orderIndex,
                                chunkIndex: -1,
                                createdAt: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : new Date().toISOString(),
                            },
                        }));
                        this.logger.log(`✨ Generated summary for ${chapter.title}`);
                    }

                } catch (err) {
                    this.logger.warn(`Skipping chapter ${chapter._id} due to error: ${err.message}`);
                }
            }

            if (documents.length > 0) {
                await this.vectorStore.addDocuments(documents);
            }

            processedCount += chapters.length;
            this.logger.log(`⏳ Indexed ${processedCount}/${totalChapters} chapters...`);
        });

        this.logger.log(`✅ Successfully indexed ${totalChapters} chapters`);

        return {
            success: true,
            totalIndexed: totalChapters,
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
     * Bulk index all authors with concurrency
     */
    async reindexAllAuthors() {
        const BATCH_SIZE = 100;
        const CONCURRENCY = 5;
        const totalAuthors = await this.authorModel.countDocuments();

        this.logger.log(`👤 Found ${totalAuthors} authors. Starting parallel indexing (Concurrency: ${CONCURRENCY})...`);

        const batches: number[] = [];
        for (let i = 0; i < totalAuthors; i += BATCH_SIZE) {
            batches.push(i);
        }

        let processedCount = 0;

        await this.runWithConcurrency(batches, CONCURRENCY, async (skip) => {
            const authors = await this.authorModel
                .find()
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean();

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

            processedCount += authors.length;
            this.logger.log(`⏳ Indexed ${processedCount}/${totalAuthors} authors...`);
        });

        this.logger.log(`✅ Indexed ${totalAuthors} authors`);

        return {
            success: true,
            totalIndexed: totalAuthors,
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
        try {
            // @ts-ignore - access private or underlying collection if possible, or assume it's exposed
            const count = await this.vectorStore.collection.count();

            return {
                collectionName: this.configService.get('CHROMA_COLLECTION', 'socialbook_books'),
                isInitialized: this.isInitialized,
                documentCount: count
            };
        } catch (error) {
            this.logger.error(`Failed to get stats: ${error.message}`);
            return {
                collectionName: this.configService.get('CHROMA_COLLECTION', 'socialbook_books'),
                isInitialized: this.isInitialized,
                error: error.message
            };
        }
    }
}
