import { Injectable } from '@nestjs/common';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { OpenAICompatibleClient } from './openai-compatible.client';

@Injectable()
export class GeminiService implements IGeminiService {
  constructor(private readonly client: OpenAICompatibleClient) {}

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return this.client.generateText(prompt, systemPrompt);
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    return this.client.generateJSON<T>(prompt, systemPrompt);
  }

  async embedText(text: string): Promise<number[]> {
    return this.client.embedText(text);
  }

  async summarizeChapter(content: string, title?: string): Promise<string> {
    const titlePart = title ? ` có tiêu đề "${title}"` : '';
    const prompt = `Hãy tóm tắt nội dung chương sau đây${titlePart}.
Trả về tóm tắt có cấu trúc:
- Bối cảnh: 1 câu
- Sự kiện chính: 2-3 câu
- Nhân vật: 1-2 câu
- Gợi mở tiếp theo: 1 câu

Ngôn ngữ: Tiếng Việt.

Nội dung chương:
${content.substring(0, 20_000)}`;

    return this.generateText(prompt);
  }
}
