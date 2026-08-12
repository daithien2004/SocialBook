import { Injectable } from '@nestjs/common';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import { IAIProviderFactoryPort } from '@/domain/ai/interfaces/ai-provider-factory.port';
import { IAIProviderPort } from '@/domain/ai/interfaces/ai-provider.port';

@Injectable()
export class AIAdapter implements IAIPort {
  private readonly provider: IAIProviderPort;

  constructor(private readonly providerFactory: IAIProviderFactoryPort) {
    this.provider = this.providerFactory.getProvider();
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return this.provider.generateText(prompt, systemPrompt);
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    return this.provider.generateJSON<T>(prompt, systemPrompt);
  }

  async embedText(text: string): Promise<number[]> {
    return this.provider.embedText(text);
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
