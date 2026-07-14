export interface ParsedChapter {
  title: string;
  content: string;
}

export interface IEpubParser {
  parseEpub(fileBuffer: Buffer, originalName: string): Promise<ParsedChapter[]>;
}
