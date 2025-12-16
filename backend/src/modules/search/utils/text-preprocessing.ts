/**
 * Text Preprocessing Utilities for Book Indexing
 * Handles Vietnamese text normalization and document creation for semantic search
 */

/**
 * Normalize Vietnamese text for better search results
 * - Preserves diacritics (important for Vietnamese)
 * - Removes excessive whitespace
 * - Handles special characters
 */
export function normalizeVietnameseText(text: string): string {
    if (!text) return '';

    return text
        .trim()
        // Collapse multiple spaces/newlines into single space
        .replace(/\s+/g, ' ')
        // Remove special characters but keep Vietnamese diacritics and basic punctuation
        .replace(/[^\p{L}\p{N}\s,.!?;:()\-]/gu, '')
        .trim();
}

/**
 * Extract keywords from text for metadata
 * Simple extraction based on word frequency and length
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
    if (!text) return [];

    const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter short words

    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and take top N
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word]) => word);
}

/**
 * Create searchable document text for a book
 * Combines all relevant fields for semantic search
 */
export function createBookDocument(book: any): string {
    const parts: string[] = [];

    // Title (most important - add multiple times for weight)
    if (book.title) {
        parts.push(`Tên sách: ${book.title}`);
        parts.push(book.title);
    }

    // Author name (high importance)
    const authorName = typeof book.authorId === 'object'
        ? book.authorId?.name
        : book.author;
    if (authorName) {
        parts.push(`Tác giả: ${authorName}`);
        parts.push(authorName);
    }

    // Description
    if (book.description) {
        parts.push(`Mô tả: ${normalizeVietnameseText(book.description)}`);
    }

    // Genres
    if (book.genres && Array.isArray(book.genres)) {
        const genreNames = book.genres
            .map((g: any) => typeof g === 'object' ? g.name : g)
            .filter(Boolean)
            .join(', ');
        if (genreNames) {
            parts.push(`Thể loại: ${genreNames}`);
        }
    }

    // Alternative titles (if exists)
    if (book.alternativeTitles && Array.isArray(book.alternativeTitles)) {
        book.alternativeTitles.forEach((altTitle: string) => {
            parts.push(`Tên khác: ${altTitle}`);
        });
    }

    return parts.join('\n');
}

/**
 * ============================================
 * CHUNKING STRATEGY FOR BETTER SEMANTIC SEARCH
 * ============================================
 * Split book description into smaller chunks for better matching
 * Each chunk can be matched independently, improving recall
 */

/**
 * Chunk text into overlapping segments
 * @param text - Text to chunk
 * @param chunkSize - Size of each chunk in characters (default: 150)
 * @param overlap - Overlap between chunks in characters (default: 50)
 */
export function chunkText(text: string, chunkSize: number = 150, overlap: number = 50): string[] {
    if (!text || text.length <= chunkSize) {
        return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunk = text.substring(start, end);

        // Try to break at sentence/word boundary
        if (end < text.length) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastSpace = chunk.lastIndexOf(' ');
            const breakPoint = lastPeriod > chunkSize * 0.5
                ? lastPeriod + 1
                : (lastSpace > chunkSize * 0.5 ? lastSpace : end);

            if (breakPoint > start) {
                chunk = text.substring(start, start + breakPoint).trim();
            }
        }

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move start position (with overlap)
        start += chunkSize - overlap;
    }

    return chunks;
}

/**
 * Create chunked documents for a book
 * Each chunk becomes a separate document in ChromaDB
 * Returns array of {text, metadata} objects
 */
export function createChunkedBookDocuments(book: any): Array<{ text: string; metadata: any }> {
    const documents: Array<{ text: string; metadata: any }> = [];

    const bookId = book._id?.toString() || book.id;
    const authorName = typeof book.authorId === 'object' ? book.authorId?.name : book.author;
    const genreNames = book.genres && Array.isArray(book.genres)
        ? book.genres.map((g: any) => typeof g === 'object' ? g.name : g).filter(Boolean).join(', ')
        : '';

    // Base metadata for all chunks
    const baseMetadata = {
        type: 'book',
        bookId,
        title: book.title || '',
        author: authorName || 'Unknown',
        genres: genreNames,
        slug: book.slug || '',
        coverUrl: book.coverUrl || '',
    };

    // Always create a main document with title + author
    const mainDoc = `Tên sách: ${book.title}\nTác giả: ${authorName || 'Unknown'}\nThể loại: ${genreNames}`;
    documents.push({
        text: mainDoc,
        metadata: { ...baseMetadata, chunkIndex: 0, chunkType: 'main' },
    });

    // Chunk the description if exists
    if (book.description && book.description.trim().length > 0) {
        const normalizedDesc = normalizeVietnameseText(book.description);
        const chunks = chunkText(normalizedDesc, 150, 50);

        chunks.forEach((chunk, index) => {
            documents.push({
                text: `${book.title}\n${chunk}`,
                metadata: {
                    ...baseMetadata,
                    chunkIndex: index + 1,
                    chunkType: 'description',
                    totalChunks: chunks.length,
                },
            });
        });
    }

    return documents;
}
