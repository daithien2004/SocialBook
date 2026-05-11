import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';

@Injectable()
export class GeminiService implements IGeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('env.GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      // Quay lại cách truyền thống để tương thích với bản v1 (Stable)
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks.`;
      const result = await this.model.generateContent(jsonPrompt);
      const response = await result.response;
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
            throw new Error(`Parse matched JSON failed: ${e.message}`);
          }
        }
        this.logger.error(`JSON Parse Error: ${parseError.message}. Content: ${text}`);
        throw new Error('Could not parse JSON response');
      }
    } catch (error) {
      if (error.message.includes('404')) {
        this.logger.error('LỖI 404: Model không tồn tại hoặc API Key không có quyền. Hãy thử dùng model "gemini-pro" hoặc kiểm tra lại Key trên Google AI Studio.');
      }
      throw new Error(`Failed to generate JSON: ${error.message}`);
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async summarizeChapter(chapterId: string): Promise<string> {
    // This would typically fetch chapter content from database
    // For now, we'll generate a summary based on the chapter ID
    const prompt = `Please provide a concise summary for the chapter with ID: ${chapterId}. 
        Focus on the main events, character development, and key plot points. 
        Keep the summary to 2-3 paragraphs.`;

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

  async analyzeReadingProgress(
    chaptersRead: number,
    totalChapters: number,
    readingSpeed: number,
  ): Promise<string> {
    const progressPercentage = Math.round((chaptersRead / totalChapters) * 100);
    const remainingChapters = totalChapters - chaptersRead;
    const estimatedTime = Math.round(remainingChapters / readingSpeed);

    const prompt = `Analyze this reading progress and provide motivational feedback:
        - Progress: ${progressPercentage}% complete (${chaptersRead}/${totalChapters} chapters)
        - Reading speed: ${readingSpeed} chapters per session
        - Estimated chapters remaining: ${remainingChapters}
        - Estimated time to finish: ${estimatedTime} sessions
        
        Provide a brief, encouraging analysis of their progress and reading habits.`;

    return this.generateText(prompt);
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
