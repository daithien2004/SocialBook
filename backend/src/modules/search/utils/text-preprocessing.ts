export function preprocessText(text: string): string {
    if (!text) return '';

    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters but keep Vietnamese
        .replace(/[^\w\s\u00C0-\u1EF9,.-]/g, '')
        // Trim
        .trim();
}

export function createBookDocument(book: any): string {
    const parts = [
        book.title ? `Tiêu đề: ${book.title}` : '',
        book.authorId?.name ? `Tác giả: ${book.authorId.name}` : '',
        book.genres?.length
            ? `Thể loại: ${book.genres.map((g: any) => g.name).join(', ')}`
            : '',
        book.description ? `Mô tả: ${book.description}` : '',
    ].filter(Boolean);

    return preprocessText(parts.join('. '));
}
