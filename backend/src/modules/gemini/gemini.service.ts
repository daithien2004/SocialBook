import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { ChaptersService } from '../chapters/chapters.service';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ChaptersService))
    private readonly chaptersService: ChaptersService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  async summarizeChapter(chapterId: string): Promise<string> {
    try {
      const chapter = await this.chaptersService.findById(chapterId);

      const content = chapter.paragraphs.map((p) => p.content).join('\n\n');

      if (!content) {
        throw new Error('Chapter content is empty');
      }

      const prompt = `
        Hãy tóm tắt nội dung của chương truyện sau đây một cách ngắn gọn, súc tích nhưng đầy đủ ý chính.
        Tóm tắt khoảng 3-5 câu.
        
        Nội dung chương:
        ${content}
      `;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error summarizing chapter:', error);
      throw new Error('Failed to summarize chapter');
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Gemini generate error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      const text = await this.generateText(prompt);

      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from AI');
    }
  }
}
