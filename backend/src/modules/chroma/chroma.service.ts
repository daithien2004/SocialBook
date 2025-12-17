import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { Book } from '../books/schemas/book.schema';
import { Author } from '../authors/schemas/author.schema';
import { createChunkedBookDocuments } from '../search/utils/text-preprocessing';
import { createAuthorDocument } from '../search/utils/content-preprocessing';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class ChromaService implements OnModuleInit {
    private readonly logger = new Logger(ChromaService.name);
    private vectorStore: Chroma;
    private embeddings: GoogleGenerativeAIEmbeddings;
    private isInitialized = false;
    private chatModel: ChatGoogleGenerativeAI;

    constructor(
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(Author.name) private authorModel: Model<Author>,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        try {
            this.embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: this.configService.get('GOOGLE_API_KEY'),
                model: 'text-embedding-004',
            });

            this.chatModel = new ChatGoogleGenerativeAI({
                apiKey: this.configService.get('GOOGLE_API_KEY'),
                model: 'gemini-2.5-flash',
                temperature: 0.7,
            });

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

        // Create chunked documents for better semantic search
        const chunkedDocs = createChunkedBookDocuments(book);
        const documents = chunkedDocs.map(({ text, metadata }) =>
            new Document({
                pageContent: text,
                metadata: {
                    ...metadata,
                    createdAt: book.createdAt ? new Date(book.createdAt as any).toISOString() : new Date().toISOString(),
                },
            })
        );

        await this.vectorStore.addDocuments(documents);
        this.logger.log(`✅ Indexed book: ${book.title} (${chunkedDocs.length} chunks)`);

        return { success: true, bookId: book._id, chunks: chunkedDocs.length };
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

            // Create chunked documents for all books
            const documents: Document[] = [];
            let totalChunks = 0;

            books.forEach((book) => {
                const chunkedDocs = createChunkedBookDocuments(book);
                totalChunks += chunkedDocs.length;

                chunkedDocs.forEach(({ text, metadata }) => {
                    documents.push(new Document({
                        pageContent: text,
                        metadata: {
                            ...metadata,
                            createdAt: book.createdAt ? new Date(book.createdAt as any).toISOString() : new Date().toISOString(),
                        },
                    }));
                });

                // Log first few books for verification
                if (processedCount < 5) {
                    this.logger.debug(`📖 ${book.title}: ${chunkedDocs.length} chunks`);
                }
            });

            if (documents.length > 0) {
                await this.vectorStore.addDocuments(documents);
            }

            processedCount += books.length;
            this.logger.log(`⏳ Indexed ${processedCount}/${totalBooks} books (${totalChunks} chunks in this batch)...`);
        });

        this.logger.log(`✅ Successfully indexed ${totalBooks} books`);

        return {
            success: true,
            totalIndexed: totalBooks,
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
            // Delete all documents by type
            await this.vectorStore.delete({ filter: { type: 'book' } }).catch(() => { });
            await this.vectorStore.delete({ filter: { type: 'author' } }).catch(() => { });

            this.logger.log(`🗑️ Cleared collection (books and authors)`);

            return {
                success: true,
                message: 'Collection cleared (books and authors)',
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

    async askChatbot(userQuestion: string) {
        if (!this.isInitialized) {
            throw new Error('Chroma Service not initialized');
        }

        const results = await this.vectorStore.similaritySearch(userQuestion, 200);

        if (!results || results.length === 0) {
            return {
                question: userQuestion,
                answer: "Xin lỗi, tôi không tìm thấy thông tin nào về vấn đề này trong thư viện sách hiện có.",
                sources: []
            };
        }
        const context = results.map(doc => doc.pageContent).join('\n\n---\n\n');

        const promptTemplate = PromptTemplate.fromTemplate(`
            Bạn là một trợ lý ảo am hiểu về sách (Thủ thư).
            Dưới đây là thông tin tôi tìm được trong thư viện dữ liệu của chúng ta:
            
            ----------------
            {context}
            ----------------

            Hãy dùng thông tin trên để trả lời câu hỏi sau của người dùng một cách tự nhiên, thân thiện và chính xác.
            
            Lưu ý:
            - Nếu thông tin trong ngữ cảnh không đủ để trả lời, hãy thành thật nói là bạn không biết, đừng tự bịa ra thông tin sai lệch.
            - Nếu có thể, hãy trích dẫn tên sách hoặc chương truyện liên quan.
            
            Câu hỏi: {question}
        `);

        const chain = RunnableSequence.from([
            promptTemplate,
            this.chatModel,
            new StringOutputParser()
        ]);

        try {
            const answer = await chain.invoke({
                context: context,
                question: userQuestion
            });

            return {
                question: userQuestion,
                answer: answer,
                sources: results.map(r => r.metadata)
            };
        } catch (error) {
            this.logger.error('Chatbot generation error:', error);
            return {
                question: userQuestion,
                answer: "Xin lỗi, tôi đang gặp chút sự cố khi suy nghĩ câu trả lời. Bạn hỏi lại sau nhé!",
                sources: []
            };
        }
    }
}
