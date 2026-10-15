export interface ChapterAudioSourceReadModel {
  id: string;
  bookId: string;
  paragraphs: Array<{ content: string }>;
}
