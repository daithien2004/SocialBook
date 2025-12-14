import { sanitizeText } from './text-preprocessing';

function splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
    if (!text) return [];
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // If we are not at the end, try to find a sentence break or space to cut cleanly
        if (endIndex < text.length) {
            // Look for the last period, question mark, or exclamation mark within the last 20% of the chunk
            const lookback = Math.floor(chunkSize * 0.2);
            const searchArea = text.substring(endIndex - lookback, endIndex);
            const lastPunctuation = searchArea.match(/[.!?]\s/);

            if (lastPunctuation && lastPunctuation.index !== undefined) {
                endIndex = endIndex - lookback + lastPunctuation.index + 1;
            } else {
                // If no punctuation, look for the last space
                const lastSpace = text.lastIndexOf(' ', endIndex);
                if (lastSpace > startIndex) {
                    endIndex = lastSpace;
                }
            }
        }

        const chunk = text.substring(startIndex, endIndex).trim();
        if (chunk) chunks.push(chunk);

        // Move start index forward, minus overlap
        startIndex = endIndex - overlap;

        // Prevent infinite loop if overlap is too big or no progress
        if (startIndex >= endIndex) startIndex = endIndex;
    }

    return chunks;
}

export function createChapterDocument(chapter: any): string[] {
    const bookTitle = sanitizeText(chapter.bookId?.title || '');
    const chapterTitle = sanitizeText(chapter.title || '');

    // Combine all paragraphs into single text first
    const fullContent = chapter.paragraphs
        .map((p: any) => sanitizeText(p.content))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Split into chunks
    const rawChunks = splitTextIntoChunks(fullContent, 1000, 200);

    // Add context to each chunk
    return rawChunks.map((chunk, index) => {
        return `Tên sách: ${bookTitle}. Chương: ${chapterTitle}. Phần ${index + 1}: ${chunk}`;
    });
}

export function createAuthorDocument(author: any): string {
    const parts = [
        author.name ? `Tên tác giả: ${sanitizeText(author.name)}` : '',
        author.bio ? `Tiểu sử: ${sanitizeText(author.bio)}` : '',
        author.nationality ? `Quốc tịch: ${sanitizeText(author.nationality)}` : '',
    ].filter(Boolean);

    return parts.join('. ').replace(/\s+/g, ' ').trim();
}
