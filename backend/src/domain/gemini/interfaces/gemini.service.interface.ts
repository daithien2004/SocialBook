export abstract class IGeminiService {
  abstract generateText(prompt: string): Promise<string>;
  abstract generateJSON<T>(prompt: string): Promise<T>;
  abstract embedText(text: string): Promise<number[]>;
  abstract summarizeChapter(content: string, title?: string): Promise<string>;
  abstract generateBookRecommendations(preferences: string): Promise<string[]>;
  abstract generateChapterTitle(content: string): Promise<string>;
  abstract extractKeywords(text: string): Promise<string[]>;
}
