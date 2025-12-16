/**
 * Content Preprocessing Utilities for Chapter and Author Indexing
 * Handles content chunking and document creation for semantic search
 */

import { normalizeVietnameseText } from './text-preprocessing';

/**
 * Split text into chunks of approximately target word count
 * Vietnamese text chunking with sentence boundary preservation
 */
function chunkText(text: string, targetWords: number = 400): string[] {
    if (!text) return [];

    const normalized = normalizeVietnameseText(text);

    // Split by sentences (Vietnamese sentence endings)
    const sentences = normalized.split(/[.!?]\s+/);

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const sentence of sentences) {
        const words = sentence.split(/\s+/).length;

        // If adding this sentence exceeds target, start new chunk
        if (currentWordCount + words > targetWords && currentChunk.length > 0) {
            chunks.push(currentChunk.join('. ') + '.');
            currentChunk = [];
            currentWordCount = 0;
        }

        currentChunk.push(sentence);
        currentWordCount += words;
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('. ') + '.');
    }

    return chunks;
}

/**
 * Create searchable document chunks for a chapter
 * Returns array of text chunks (300-500 words each)
 */
export function createChapterDocument(chapter: any): string[] {
    if (!chapter.content) return [];

    const chunks = chunkText(chapter.content, 400);

    // Enhance each chunk with chapter context
    return chunks.map((chunk, index) => {
        const contextParts: string[] = [];

        // Add chapter title to first chunk for context
        if (index === 0 && chapter.title) {
            contextParts.push(`Chương: ${chapter.title}`);
        }

        // Add book context if available
        const bookTitle = typeof chapter.bookId === 'object'
            ? chapter.bookId?.title
            : null;
        if (bookTitle && index === 0) {
            contextParts.push(`Sách: ${bookTitle}`);
        }

        contextParts.push(chunk);

        return contextParts.join('\n');
    });
}

/**
 * Create searchable document text for an author
 * Combines name, bio, and other relevant information
 */
export function createAuthorDocument(author: any): string {
    const parts: string[] = [];

    // Author name (most important - add multiple times)
    if (author.name) {
        parts.push(`Tác giả: ${author.name}`);
        parts.push(author.name);
    }

    // Bio/Description
    if (author.bio) {
        parts.push(`Tiểu sử: ${normalizeVietnameseText(author.bio)}`);
    }

    // Nationality
    if (author.nationality) {
        parts.push(`Quốc t적: ${author.nationality}`);
    }

    // Alternative names or pen names
    if (author.alternativeNames && Array.isArray(author.alternativeNames)) {
        author.alternativeNames.forEach((altName: string) => {
            parts.push(`Bút danh: ${altName}`);
        });
    }

    return parts.join('\n');
}
