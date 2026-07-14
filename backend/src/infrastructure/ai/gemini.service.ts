import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';

@Injectable()
export class GeminiService implements IGeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('env.GOOGLE_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_API_KEY is not configured',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to generate text: ${message}`,
      );
    }
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      // Quay lại cách truyền thống để tương thích với bản v1 (Stable)
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks.`;
      const result = await this.model.generateContent(jsonPrompt);
      const response = result.response;
      const text = response.text();

      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        // Tìm JSON trong text nếu AI trả về kèm theo text khác hoặc markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]) as T;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new InternalServerErrorException(
              `Parse matched JSON failed: ${msg}`,
            );
          }
        }
        const parseMsg =
          parseError instanceof Error ? parseError.message : String(parseError);
        this.logger.error(`JSON Parse Error: ${parseMsg}. Content: ${text}`);
        throw new InternalServerErrorException('Could not parse JSON response');
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('404')) {
        this.logger.error(
          'LỖI 404: Model không tồn tại hoặc API Key không có quyền. Hãy thử dùng model "gemini-pro" hoặc kiểm tra lại Key trên Google AI Studio.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to generate JSON: ${errMsg}`,
      );
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to generate embedding: ${message}`,
      );
    }
  }

  async summarizeChapter(content: string, title?: string): Promise<string> {
    const prompt = `Hãy cung cấp một bản tóm tắt ngắn gọn cho nội dung chương sau đây${title ? ` có tiêu đề "${title}"` : ''}.
        Tập trung vào các sự kiện chính, sự phát triển của nhân vật và các điểm cốt truyện quan trọng.
        Giữ bản tóm tắt trong 2-3 đoạn văn.
        Hãy trả lời bằng tiếng Việt.
        
        Nội dung chương:
        ${content.substring(0, 25000)}
        `;

    return this.generateText(prompt);
  }

  async generateBookRecommendations(preferences: string): Promise<string[]> {
    const prompt = `Based on these reading preferences: "${preferences}", 
        please recommend 5 books that the user might enjoy. 
        Format your response as a numbered list with book titles only, one per line.
        Do not include any additional text or explanations.`;

    const response = await this.generateText(prompt);

    // Parse the numbered list into an array
    return response
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((title) => title.length > 0);
  }

  async generateChapterTitle(content: string): Promise<string> {
    const prompt = `Based on this chapter content, generate a compelling and appropriate chapter title:
        
        ${content.substring(0, 1000)}... // Limit content length
        
        The title should be:
        - Engaging and descriptive
        - No more than 10 words
        - Appropriate for the genre and tone
        - In the same language as the content
        
        Respond with only the title, no additional text.`;

    return this.generateText(prompt);
  }

  async extractKeywords(text: string): Promise<string[]> {
    const prompt = `Extract the most important keywords and key phrases from this text:
        
        ${text.substring(0, 2000)}... // Limit text length
        
        Please provide:
        - 5-10 relevant keywords
        - Focus on themes, characters, places, and important concepts
        - One keyword per line
        - No additional text or explanations
        
        Format as a simple list.`;

    const response = await this.generateText(prompt);

    return response
      .split('\n')
      .map((line) => line.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 10); // Limit to 10 keywords
  }
}
