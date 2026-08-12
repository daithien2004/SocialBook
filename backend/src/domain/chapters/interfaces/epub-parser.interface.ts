export interface ParsedChapter {
  title: string;
  content: string;
}

export abstract class IEpubParser {
  abstract parseEpub(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<ParsedChapter[]>;
}
