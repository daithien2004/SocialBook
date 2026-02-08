import { Inject } from '@nestjs/common';
import { INFRASTRUCTURE_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';
import type { IAIRequestRepository } from '@/domain/gemini/repositories/ai-request.repository.interface';
import { AIRequest, AIRequestType } from '@/domain/gemini/entities/ai-request.entity';
import { UserId } from '@/domain/gemini/value-objects/user-id.vo';

export interface SummarizeChapterRequest {
    chapterId: string;
    userId: string;
}

export interface SummarizeChapterResponse {
    summary: string;
    requestId: string;
    chapterId: string;
    summaryLength: number;
}

export class SummarizeChapterUseCase {
    constructor(
        @Inject(INFRASTRUCTURE_TOKENS.GEMINI_SERVICE)
        private readonly geminiService: IGeminiService,
        @Inject(INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY)
        private readonly aiRequestRepository: IAIRequestRepository
    ) {}

    async execute(request: SummarizeChapterRequest): Promise<SummarizeChapterResponse> {
        const userId = UserId.create(request.userId);
        
        const aiRequest = AIRequest.create({
            prompt: `Summarize chapter with ID: ${request.chapterId}`,
            type: AIRequestType.CHAPTER_SUMMARY,
            userId: request.userId,
            metadata: { chapterId: request.chapterId }
        });

        try {
            const summary = await this.geminiService.summarizeChapter(request.chapterId);
            
            aiRequest.setResponse(summary);
            await this.aiRequestRepository.save(aiRequest);

            return {
                summary,
                requestId: aiRequest.id.toString(),
                chapterId: request.chapterId,
                summaryLength: aiRequest.getResponseLength()
            };
        } catch (error) {
            await this.aiRequestRepository.save(aiRequest);
            throw error;
        }
    }
}


