export interface IGeminiService {
    generateText(prompt: string): Promise<string>;
    generateJSON<T>(prompt: string): Promise<T>;
    embedText(text: string): Promise<number[]>;
    summarizeChapter(chapterId: string): Promise<string>;
    generateBookRecommendations(preferences: string): Promise<string[]>;
    analyzeReadingProgress(chaptersRead: number, totalChapters: number, readingSpeed: number): Promise<string>;
    generateChapterTitle(content: string): Promise<string>;
    extractKeywords(text: string): Promise<string[]>;
}
