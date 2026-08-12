export interface ParsedChapter {
  title: string;
  content: string;
}

export abstract class IEpubParserPort {
  abstract parseEpub(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<ParsedChapter[]>;
}
