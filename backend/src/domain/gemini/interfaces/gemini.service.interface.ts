export abstract class IGeminiService {
  abstract generateText(prompt: string): Promise<string>;
  abstract generateJSON<T>(prompt: string): Promise<T>;
  abstract embedText(text: string): Promise<number[]>;
  abstract summarizeChapter(chapterId: string): Promise<string>;
  abstract generateBookRecommendations(preferences: string): Promise<string[]>;
  abstract analyzeReadingProgress(
    chaptersRead: number,
    totalChapters: number,
    readingSpeed: number,
  ): Promise<string>;
  abstract generateChapterTitle(content: string): Promise<string>;
  abstract extractKeywords(text: string): Promise<string[]>;
}
