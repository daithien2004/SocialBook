import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { ChaptersService } from '../chapters/chapters.service';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly chaptersService: ChaptersService,
  ) {
    const apiKey = this.configService.getOrThrow('GOOGLE_API_KEY');

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractInsights(file: Express.Multer.File): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: 'application/pdf',
          },
        },
        'Extract key insights',
      ]);
      return result.response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to extract insights');
    }
  }

  async summarizeChapter(chapterId: string): Promise<string> {
    try {
      // 1. Lấy nội dung chapter
      const chapter = await this.chaptersService.findById(chapterId);
      
      // 2. Ghép nội dung các đoạn văn
      const content = chapter.paragraphs.map((p) => p.content).join('\n\n');

      if (!content) {
        throw new Error('Chapter content is empty');
      }

      // 3. Gọi Gemini API
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const prompt = `
        Hãy tóm tắt nội dung của chương truyện sau đây một cách ngắn gọn, súc tích nhưng đầy đủ ý chính.
        Tóm tắt khoảng 3-5 câu.
        
        Nội dung chương:
        ${content}
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error summarizing chapter:', error);
      throw new Error('Failed to summarize chapter');
    }
  }
}
