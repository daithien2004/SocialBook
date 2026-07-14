import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import {
  IEpubParser,
  ParsedChapter,
} from '@/domain/chapters/interfaces/epub-parser.interface';

interface EpubChapterRef {
  id?: string;
  title?: string;
  href?: string;
}

interface EpubInstance {
  flow?: EpubChapterRef[];
  on(event: string, callback: (...args: unknown[]) => void): this;
  getChapter(
    chapterId: string,
    callback: (error: Error, text?: string) => void,
  ): void;
  parse(): void;
}

@Injectable()
export class EpubParserService implements IEpubParser {
  async parseEpub(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<ParsedChapter[]> {
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `upload_${Date.now()}_${originalName}`);

    try {
      await fs.writeFile(tmpFile, fileBuffer);

      const { EPub: EPubConstructor } = await import('epub2');
      if (typeof EPubConstructor !== 'function') {
        throw new InternalServerErrorException(
          'epub2 module loaded but EPub is not a constructor',
        );
      }

      const epub: EpubInstance = new EPubConstructor(tmpFile);

      const chapters = await new Promise<ParsedChapter[]>((resolve, reject) => {
        epub.on('end', () => {
          const result: ParsedChapter[] = [];
          const flow: EpubChapterRef[] = epub.flow || [];

          const processFlow = async () => {
            for (const chapter of flow) {
              if (!chapter.id) continue;

              const chapterText = await new Promise<string>((res, rej) => {
                epub.getChapter(chapter.id!, (err: Error, text: string) => {
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
          };

          processFlow().catch((err: unknown) => {
            reject(err instanceof Error ? err : new Error(String(err)));
          });
        });

        epub.on('error', (err: unknown) => {
          reject(err instanceof Error ? err : new Error(String(err)));
        });
        epub.parse();
      });

      return chapters;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Không thể parse file EPUB: ${message}`);
    } finally {
      await fs.unlink(tmpFile).catch(() => null);
    }
  }
}
