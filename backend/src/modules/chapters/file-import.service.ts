// file-import.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ParsedChapter {
    title: string;
    content: string;
}

export interface FileValidation {
    maxSize: number; // bytes
    allowedTypes: string[];
}

@Injectable()
export class FileImportService {
    private readonly defaultValidation: FileValidation = {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
            'application/epub+zip',
            'application/epub',
            'application/x-mobipocket-ebook', // MOBI
            'application/vnd.amazon.mobi8-ebook' // AZW3
        ]
    };

    /**
     * Parse uploaded file (EPUB or MOBI) into chapters
     */
    async parseFile(
        file: Express.Multer.File,
        validation?: Partial<FileValidation>
    ): Promise<ParsedChapter[]> {
        const config = { ...this.defaultValidation, ...validation };

        // Validate file
        this.validateFile(file, config);

        const mimeType = file.mimetype;
        const fileName = file.originalname.toLowerCase();

        try {
            // Check EPUB
            if (mimeType === 'application/epub+zip' || mimeType === 'application/epub') {
                return await this.parseEpub(file.buffer);
            }
            // Check MOBI/AZW3 by mime type or file extension
            else if (
                mimeType === 'application/x-mobipocket-ebook' ||
                mimeType === 'application/vnd.amazon.mobi8-ebook' ||
                fileName.endsWith('.mobi') ||
                fileName.endsWith('.azw3') ||
                fileName.endsWith('.azw')
            ) {
                return await this.parseMobi(file.buffer);
            }
            else {
                throw new BadRequestException(
                    `Unsupported file type: ${mimeType}. Only EPUB and MOBI formats are supported.`
                );
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Failed to parse file: ${error.message}`
            );
        }
    }

    /**
     * Validate uploaded file
     */
    private validateFile(file: Express.Multer.File, config: FileValidation): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('File is empty');
        }

        if (file.size > config.maxSize) {
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
            throw new BadRequestException(
                `File size exceeds maximum allowed size of ${maxSizeMB}MB`
            );
        }

        const fileName = file.originalname.toLowerCase();
        const isMobi = fileName.endsWith('.mobi') || fileName.endsWith('.azw3') || fileName.endsWith('.azw');

        if (!config.allowedTypes.includes(file.mimetype) && !isMobi) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: EPUB, MOBI, AZW3`
            );
        }
    }

    /**
     * Parse EPUB file
     */
    private async parseEpub(buffer: Buffer): Promise<ParsedChapter[]> {
        return new Promise((resolve, reject) => {
            // Handle different export styles (CommonJS vs ESM interop)
            const EPubImport = require('epub2');
            const EPub = EPubImport.EPub || EPubImport.default || EPubImport;

            const tempFilePath = path.join(os.tmpdir(), `upload-${uuidv4()}.epub`);

            try {
                // Write buffer to temporary file
                fs.writeFileSync(tempFilePath, buffer);

                const epub = new EPub(tempFilePath);

                epub.on('end', async () => {
                    try {
                        const chapters: ParsedChapter[] = [];

                        // Process each chapter from spine
                        for (const chapterRef of epub.flow) {
                            const chapterText = await this.getEpubChapter(epub, chapterRef.id);
                            const plainText = this.stripHtml(chapterText);

                            // Get chapter title
                            let title = chapterRef.title || chapterRef.id;
                            const tocItem = epub.toc.find((t: any) => t.href === chapterRef.href);
                            if (tocItem?.title) {
                                title = tocItem.title;
                            }

                            // Only add chapters with content
                            if (plainText.trim().length > 0) {
                                const metadataTitle = title || `Chapter ${chapters.length + 1}`;
                                const processed = this.processChapterContent(metadataTitle, plainText);

                                chapters.push({
                                    title: processed.title,
                                    content: processed.content
                                });
                            }
                        }

                        // Cleanup temp file
                        this.cleanupTempFile(tempFilePath);

                        if (chapters.length === 0) {
                            reject(new BadRequestException('No content found in EPUB file'));
                        } else {
                            resolve(chapters);
                        }
                    } catch (error) {
                        this.cleanupTempFile(tempFilePath);
                        reject(error);
                    }
                });

                epub.on('error', (err: any) => {
                    this.cleanupTempFile(tempFilePath);
                    reject(new BadRequestException(`EPUB parsing error: ${err.message}`));
                });

                epub.parse();
            } catch (error: any) {
                this.cleanupTempFile(tempFilePath);
                reject(new BadRequestException(`Failed to read EPUB file: ${error.message}`));
            }
        });
    }

    /**
     * Get chapter content from EPUB
     */
    private getEpubChapter(epub: any, chapterId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            epub.getChapter(chapterId, (err: any, text: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(text || '');
                }
            });
        });
    }

    /**
     * Parse MOBI file
     */
    private async parseMobi(buffer: Buffer): Promise<ParsedChapter[]> {
        try {
            // Import @lingo-reader/mobi-parser library (ES module)
            const { initMobiFile } = await import('@lingo-reader/mobi-parser');

            // Convert Buffer to Uint8Array
            const uint8Array = new Uint8Array(buffer);

            // Initialize and parse the MOBI file
            const mobi = await initMobiFile(uint8Array);

            const chapters: ParsedChapter[] = [];

            // Get the spine (array of chapters with id fields)
            const spine = await mobi.getSpine();

            // Process each chapter in the spine
            for (let i = 0; i < spine.length; i++) {
                const spineItem = spine[i];

                // Load chapter content using the id
                const processedChapter = await mobi.loadChapter(spineItem.id);

                if (!processedChapter) {
                    continue;
                }

                // Extract title from HTML content
                let title = this.extractTitleFromHtml(processedChapter.html) || `Chapter ${i + 1}`;

                // Extract plain text from HTML content
                const plainText = this.stripHtml(processedChapter.html);

                // Only add chapters with substantial content
                if (plainText.trim().length > 100) {
                    const processed = this.processChapterContent(title, plainText);

                    chapters.push({
                        title: processed.title,
                        content: processed.content
                    });
                }
            }

            // Fallback: If no chapters were extracted, try metadata
            if (chapters.length === 0) {
                const metadata = await mobi.getMetadata();

                // Try to get some content from the first spine item
                if (spine.length > 0) {
                    const firstChapter = await mobi.loadChapter(spine[0].id);
                    if (firstChapter) {
                        const plainText = this.stripHtml(firstChapter.html);

                        chapters.push({
                            title: metadata?.title || 'Imported Content',
                            content: plainText
                        });
                    }
                }
            }

            if (chapters.length === 0) {
                throw new BadRequestException('No content found in MOBI file');
            }

            return chapters;
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`MOBI parsing error: ${error.message}`);
        }
    }

    /**
     * Strip HTML tags and convert to plain text
     */
    private stripHtml(html: string): string {
        // Replace block-level tags with newlines
        let text = html.replace(/<\/(p|div|h\d|li|tr|br)>/gi, '\n');
        text = text.replace(/<br\s*\/?>/gi, '\n');

        // Remove all remaining HTML tags
        text = text.replace(/<[^>]*>/gm, '');

        // Decode HTML entities
        text = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'");

        // Normalize whitespace while preserving paragraph breaks
        return text
            .split('\n')
            .map(line => line.replace(/\s+/g, ' ').trim())
            .filter(line => line.length > 0)
            .join('\n');
    }

    /**
     * Extract title from HTML content
     * Looks for h1, h2, h3 tags or first meaningful line of text
     */
    private extractTitleFromHtml(html: string): string | null {
        if (!html) return null;

        // Try to find heading tags (h1, h2, h3)
        const headingMatch = html.match(/<h[123][^>]*>(.*?)<\/h[123]>/i);
        if (headingMatch) {
            const title = this.stripHtml(headingMatch[1]).trim();
            if (title.length > 0 && title.length < 200) {
                return title;
            }
        }

        // Try to find title in <title> tag
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) {
            const title = this.stripHtml(titleMatch[1]).trim();
            if (title.length > 0 && title.length < 200) {
                return title;
            }
        }

        // Fallback: Get first paragraph or div content
        const firstContentMatch = html.match(/<(?:p|div)[^>]*>(.*?)<\/(?:p|div)>/i);
        if (firstContentMatch) {
            const title = this.stripHtml(firstContentMatch[1]).trim();
            // Only use if it's a reasonable title length
            if (title.length > 0 && title.length < 200) {
                return title;
            }
        }

        // Last fallback: Get first line of plain text
        const plainText = this.stripHtml(html);
        const firstLine = plainText.split('\n')[0]?.trim();
        if (firstLine && firstLine.length > 0 && firstLine.length < 200) {
            return firstLine;
        }

        return null;
    }

    /**
     * Process chapter content to extract title and clean body
     */
    private processChapterContent(metadataTitle: string, content: string): { title: string; content: string } {
        let cleanedContent = content.trim();
        let finalTitle = metadataTitle;

        // Regex to detect chapter headers at the start of content
        // Matches: "Chapter 1", "Chương 1", "Hồi 1", "Phần 1" followed by optional title
        // Case insensitive, handles various separators like ":", ".", or just space
        const headerRegex = /^(?:Chương|Chapter|Hồi|Phần)\s+\d+(?:[:.-]?\s*.*)?$/im;

        // Get the first few lines to check for header
        const lines = cleanedContent.split('\n');
        const firstLine = lines[0]?.trim();

        if (firstLine && headerRegex.test(firstLine)) {
            // Found a better title in content!
            // Remove the prefix "Chương X[:.-]" to get the clean title
            const prefixRegex = /^(?:Chương|Chapter|Hồi|Phần)\s+\d+(?:[:.-])?\s*/i;
            finalTitle = firstLine.replace(prefixRegex, '').trim();

            // Remove the title line from content
            cleanedContent = lines.slice(1).join('\n').trim();
        } else {
            // Fallback: Try to remove metadata title if it appears at start
            const normalizedTitle = metadataTitle.trim().toLowerCase();
            const prefixesToCheck = [
                metadataTitle,
                `Table of ${metadataTitle}`,
                `Mục lục ${metadataTitle}`,
                `Chapter ${metadataTitle}`,
                `Chương ${metadataTitle}`
            ];

            for (const prefix of prefixesToCheck) {
                if (cleanedContent.toLowerCase().startsWith(prefix.toLowerCase())) {
                    cleanedContent = cleanedContent.substring(prefix.length).trim();
                }
            }
        }

        // Remove "Table of Contents" markers if they appear alone
        const tocMarkers = ['Table of Contents', 'Mục lục', 'Nội dung'];
        for (const marker of tocMarkers) {
            if (cleanedContent.toLowerCase().startsWith(marker.toLowerCase())) {
                cleanedContent = cleanedContent.substring(marker.length).trim();
            }
        }

        return { title: finalTitle, content: cleanedContent };
    }

    /**
     * Cleanup temporary file
     */
    private cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`Failed to cleanup temp file ${filePath}:`, error);
        }
    }

    /**
     * Get file metadata
     */
    getFileMetadata(file: Express.Multer.File) {
        return {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
        };
    }
}
