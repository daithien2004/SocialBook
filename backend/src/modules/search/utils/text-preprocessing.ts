/**
 * Sanitize text to remove invalid Unicode characters that cause ChromaDB errors
 * and normalize whitespace.
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Remove lone surrogates and invalid Unicode sequences
    return text
        .replace(/[\uD800-\uDFFF]/g, '') // Remove unpaired surrogates
        .replace(/\uFFFD/g, '') // Remove replacement characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t, \n, \r
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * @deprecated Use sanitizeText instead
 */
export function preprocessText(text: string): string {
    return sanitizeText(text);
}

export function createBookDocument(book: any): string {
    const authorName = book.authorId?.name;

    const parts = [
        book.title ? `Tiêu đề: ${book.title}` : '',
        // Repeat author name multiple times to increase semantic weight
        authorName ? `Tác giả: ${authorName}` : '',
        authorName ? `Người viết: ${authorName}` : '',
        authorName ? `Tên tác giả: ${authorName}` : '',
        book.genres?.length
            ? `Thể loại: ${book.genres.map((g: any) => g.name).join(', ')}`
            : '',
        book.tags?.length
            ? `Từ khóa: ${book.tags.join(', ')}`
            : '',
        book.description ? `Mô tả: ${book.description}` : '',
    ].filter(Boolean);

    return sanitizeText(parts.join('. '));
}
