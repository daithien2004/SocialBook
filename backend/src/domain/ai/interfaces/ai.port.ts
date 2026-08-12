export abstract class IAIPort {
  abstract generateText(prompt: string, systemPrompt?: string): Promise<string>;
  abstract generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
  abstract embedText(text: string): Promise<number[]>;
  abstract summarizeChapter(content: string, title?: string): Promise<string>;
}
