import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface ParsedChapter {
    title: string;
    content: string;
}

@Injectable()
export class EpubParserService {
    async parseEpub(fileBuffer: Buffer, originalName: string): Promise<ParsedChapter[]> {
        const tmpDir = os.tmpdir();
        const tmpFile = path.join(tmpDir, `upload_${Date.now()}_${originalName}`);

        try {
            await fs.writeFile(tmpFile, fileBuffer);

            // epub2 exports both .EPub (named) and .default - use .EPub as primary
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const epubModule = require('epub2');
            const EPub = epubModule.EPub ?? epubModule.default ?? epubModule;

            if (typeof EPub !== 'function') {
                throw new Error(`epub2 module loaded but EPub is not a constructor. Keys: ${Object.keys(epubModule).join(', ')}`);
            }

            const epub: any = new EPub(tmpFile);

            const chapters = await new Promise<ParsedChapter[]>((resolve, reject) => {
                epub.on('end', async () => {
                    try {
                        const result: ParsedChapter[] = [];
                        const flow: any[] = epub.flow || [];

                        for (const chapter of flow) {
                            if (!chapter.id) continue;

                            const chapterText = await new Promise<string>((res, rej) => {
                                epub.getChapter(chapter.id, (err: Error, text: string) => {
                                    if (err) rej(err);
                                    else res(text || '');
                                });
                            });

                            const plainText = chapterText
                                .replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<\/p>/gi, '\n')
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/\r\n/g, '\n')
                                .replace(/\n{3,}/g, '\n\n')
                                .trim();

                            if (!plainText || plainText.length < 10) continue;

                            const title = chapter.title || `Chương ${result.length + 1}`;
                            result.push({ title, content: plainText });
                        }

                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                });

                epub.on('error', reject);
                epub.parse();
            });

            return chapters;
        } catch (error) {
            throw new BadRequestException(`Không thể parse file EPUB: ${error.message}`);
        } finally {
            await fs.unlink(tmpFile).catch(() => null);
        }
    }
}
