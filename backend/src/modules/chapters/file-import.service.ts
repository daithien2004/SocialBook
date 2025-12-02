// file-import.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as pdf from 'pdf-parse';
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
        allowedTypes: ['application/epub+zip', 'application/pdf', 'application/epub']
    };

    /**
     * Parse uploaded file (PDF or EPUB) into chapters
     */
    async parseFile(
        file: Express.Multer.File,
        validation?: Partial<FileValidation>
    ): Promise<ParsedChapter[]> {
        const config = { ...this.defaultValidation, ...validation };

        // Validate file
        this.validateFile(file, config);

        const mimeType = file.mimetype;

        try {
            if (mimeType === 'application/epub+zip' || mimeType === 'application/epub') {
                return await this.parseEpub(file.buffer);
            } else if (mimeType === 'application/pdf') {
                return await this.parsePdf(file.buffer);
            } else {
                throw new BadRequestException(
                    `Unsupported file type: ${mimeType}. Only EPUB and PDF are supported.`
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

        if (!config.allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`
            );
        }
    }

    /**
     * Parse EPUB file
     */
    private async parseEpub(buffer: Buffer): Promise<ParsedChapter[]> {
        return new Promise((resolve, reject) => {
            const EPubImport = require('epub2');
            console.log('EPubImport type:', typeof EPubImport);
            console.log('EPubImport keys:', Object.keys(EPubImport));

            // Handle different export styles (CommonJS vs ESM interop)
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
                            const tocItem = epub.toc.find(t => t.href === chapterRef.href);
                            if (tocItem?.title) {
                                title = tocItem.title;
                            }

                            // Only add chapters with content
                            if (plainText.trim().length > 0) {
                                chapters.push({
                                    title: title || `Chapter ${chapters.length + 1}`,
                                    content: plainText
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

                epub.on('error', (err) => {
                    this.cleanupTempFile(tempFilePath);
                    reject(new BadRequestException(`EPUB parsing error: ${err.message}`));
                });

                epub.parse();
            } catch (error) {
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
            epub.getChapter(chapterId, (err, text) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(text || '');
                }
            });
        });
    }

    /**
     * Parse PDF file
     */
    private async parsePdf(buffer: Buffer): Promise<ParsedChapter[]> {
        try {
            const data = await pdf(buffer);
            const fullText = data.text;

            if (!fullText || fullText.trim().length === 0) {
                throw new BadRequestException('PDF file contains no readable text');
            }

            // Try to split by chapter markers
            const chapters = this.splitPdfIntoChapters(fullText);

            return chapters;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`PDF parsing error: ${error.message}`);
        }
    }

    /**
     * Split PDF text into chapters using heuristics
     */
    private splitPdfIntoChapters(fullText: string): ParsedChapter[] {
        // Pattern to detect chapter headings
        // Matches: "Chapter 1", "Chương 1", "Phần 1", "CHAPTER I", etc.
        const chapterRegex = /(?:^|\n)((?:Chapter|Chương|Phần|CHAPTER|CHƯƠNG|PHẦN)\s+(?:\d+|[IVXLCDM]+)[^\n]*)(?:\n|$)/gi;

        const parts = fullText.split(chapterRegex);

        // If no chapters detected, return entire content
        if (parts.length < 3) {
            return [{
                title: 'Imported Content',
                content: fullText.trim()
            }];
        }

        const chapters: ParsedChapter[] = [];

        // Add preamble if exists
        if (parts[0]?.trim()) {
            chapters.push({
                title: 'Introduction',
                content: parts[0].trim()
            });
        }

        // Process chapter pairs (title, content)
        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const content = parts[i + 1]?.trim();

            if (title && content) {
                chapters.push({
                    title: title,
                    content: content
                });
            }
        }

        return chapters.length > 0 ? chapters : [{
            title: 'Imported Content',
            content: fullText.trim()
        }];
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




