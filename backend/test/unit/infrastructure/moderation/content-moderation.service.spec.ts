import { ContentModerationService } from '@/infrastructure/moderation/content-moderation.service';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { ConfigService } from '@nestjs/config';
import { updateToxicWordsCache } from '@/domain/content-moderation/utils/vietnamese-profanity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContentModerationService (Unit)', () => {
  let service: ContentModerationService;
  let mockGeminiService: jest.Mocked<IGeminiService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeminiService = {
      generateText: jest.fn(),
      generateJSON: jest.fn(),
      embedText: jest.fn(),
      summarizeChapter: jest.fn(),
      generateBookRecommendations: jest.fn(),
      generateChapterTitle: jest.fn(),
      extractKeywords: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn(),
    } as any;

    service = new ContentModerationService(
      mockGeminiService,
      mockConfigService,
    );

    // Populate memory cache for regex check
    updateToxicWordsCache([
      { pattern: 'đ[ịi]t\\s*m', group: 'thô tục mạnh' },
      { pattern: 'l[ồổõọ]n', group: 'thô tục mạnh' },
    ]);
  });

  describe('Regex check (Vietnamese Profanity)', () => {
    it('should block extremely vulgar words immediately without API calls', async () => {
      const result = await service.checkContent('địt mẹ bài viết này');

      expect(result.isSafe).toBe(false);
      expect(result.isToxic).toBe(true);
      expect(result.action).toBe('BLOCK');
      expect(mockGeminiService.generateJSON).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should allow empty or whitespace-only text immediately', async () => {
      const result = await service.checkContent('   ');

      expect(result.isSafe).toBe(true);
      expect(result.action).toBe('ALLOW');
      expect(mockGeminiService.generateJSON).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Gemini fallback (MODERATION_API_KEY not configured)', () => {
    it('should call GeminiService when MODERATION_API_KEY is missing', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'env.MODERATION_API_KEY') return '';
        return null;
      });

      mockGeminiService.generateJSON.mockResolvedValue({
        action: 'ALLOW',
        category: 'none',
        score: 10,
        reason: '',
      });

      const result = await service.checkContent('Tôi thích cuốn sách này lắm!');

      expect(result.isSafe).toBe(true);
      expect(result.action).toBe('ALLOW');
      expect(mockGeminiService.generateJSON).toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Beeknoee Custom API (MODERATION_API_KEY configured)', () => {
    it('should call Custom HTTP endpoint and parse OpenAI-completions response', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'env.MODERATION_API_KEY') return 'mock-beeknoee-key';
        if (key === 'env.MODERATION_API_BASE_URL')
          return 'https://api.beeknoee.com/v1';
        if (key === 'env.MODERATION_MODEL') return 'gemini-2.5-flash';
        return null;
      });

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: 'BLOCK',
                  category: 'toxic',
                  score: 95,
                  reason: 'Chứa nội dung công kích cá nhân.',
                }),
              },
            },
          ],
        },
      });

      const result = await service.checkContent('Nội dung không phù hợp ở đây');

      expect(result.isSafe).toBe(false);
      expect(result.isToxic).toBe(true);
      expect(result.action).toBe('BLOCK');
      expect(result.reason).toBe('Chứa nội dung công kích cá nhân.');
      expect(mockGeminiService.generateJSON).not.toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.beeknoee.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          response_format: { type: 'json_object' },
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-beeknoee-key',
          }),
        }),
      );
    });

    it('should recover using regex parsing if response has markdown blocks', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'env.MODERATION_API_KEY') return 'mock-beeknoee-key';
        return null;
      });

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content:
                  '```json\n{\n  "action": "ALLOW",\n  "category": "none",\n  "score": 5,\n  "reason": ""\n}\n```',
              },
            },
          ],
        },
      });

      const result = await service.checkContent('Một bài viết sạch sẽ');

      expect(result.isSafe).toBe(true);
      expect(result.action).toBe('ALLOW');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should return REVIEW when custom endpoint fails', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'env.MODERATION_API_KEY') return 'mock-beeknoee-key';
        return null;
      });

      mockedAxios.post.mockRejectedValue(new Error('Network Timeout'));

      const result = await service.checkContent('Nội dung ngẫu nhiên');

      expect(result.isSafe).toBe(false);
      expect(result.action).toBe('REVIEW');
      expect(result.reason).toContain(
        'Hệ thống kiểm duyệt AI tạm thời gián đoạn',
      );
    });
  });
});
