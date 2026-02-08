import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';
import { ModerationResult } from '@/domain/content-moderation/interfaces/moderation-result.interface';
import { containsVietnameseToxicWords } from '@/infrastructure/utils/vietnamese-profanity';
import { containsSpoilers } from '@/infrastructure/utils/spoiler-detection';

@Injectable()
export class ContentModerationService implements IContentModerationService {
    private readonly logger = new Logger(ContentModerationService.name);
    private readonly rapidApiKey: string;
    private readonly rapidApiHost: string;
    private readonly apiUrl: string;

    constructor(private configService: ConfigService) {
        this.rapidApiKey = this.configService.get<string>('RAPID_MODER_API_KEY') || '';
        this.rapidApiHost = this.configService.get<string>('RAPID_API_HOST') || 'nsfw-text-moderation-api.p.rapidapi.com';
        this.apiUrl = this.configService.get<string>('RAPID_API_URL') || 'https://nsfw-text-moderation-api.p.rapidapi.com/moderation_check.php';

        if (!this.rapidApiKey) {
            this.logger.error('⚠️  RAPID_MODER_API_KEY is missing! Content moderation will be SKIPPED.');
        } else {
            this.logger.log('✅ Content Moderation Service initialized with RapidAPI.');
        }
    }

    async checkContent(text: string): Promise<ModerationResult> {
        if (!this.rapidApiKey) {
            this.logger.warn('RAPID_API_KEY not found. Skipping moderation.');
            return { isSafe: true, isSpoiler: false, isToxic: false };
        }

        // Check Vietnamese toxic words first (faster, local)
        const vietnameseMatch = containsVietnameseToxicWords(text);
        if (vietnameseMatch) {
            this.logger.debug(`Vietnamese toxic word detected: ${vietnameseMatch}`);
            return {
                isSafe: false,
                isSpoiler: false,
                isToxic: true,
                reason: `Phát hiện nội dung xúc phạm, không phù hợp`,
            };
        }

        // Check for spoilers
        const hasSpoilers = containsSpoilers(text);
        if (hasSpoilers) {
            this.logger.debug(`Spoiler content detected`);
            return {
                isSafe: false,
                isSpoiler: true,
                isToxic: false,
                reason: `Phát hiện nội dung spoiler`,
            };
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'x-rapidapi-key': this.rapidApiKey,
                    'x-rapidapi-host': this.rapidApiHost,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                this.logger.error(`RapidAPI Error: ${response.status} ${response.statusText}`);
                return { isSafe: true, isSpoiler: false, isToxic: false };
            }

            const result = await response.json() as {
                moderation_classes?: {
                    toxic?: number;
                    sexual?: number;
                    violent?: number;
                    insulting?: number;
                    discriminatory?: number;
                    'self-harm'?: number;
                }
            };

            this.logger.debug(`RapidAPI Response: ${JSON.stringify(result)}`);

            if (result?.moderation_classes) {
                const classes = result.moderation_classes;
                const threshold = 0.5;
                const isToxic =
                    (classes.toxic || 0) > threshold ||
                    (classes.sexual || 0) > threshold ||
                    (classes.violent || 0) > threshold ||
                    (classes.insulting || 0) > threshold ||
                    (classes.discriminatory || 0) > threshold ||
                    (classes['self-harm'] || 0) > threshold;

                let reason = '';
                if (isToxic) {
                    const reasons: string[] = [];
                    if ((classes.toxic || 0) > threshold) reasons.push('độc hại');
                    if ((classes.sexual || 0) > threshold) reasons.push('tình dục');
                    if ((classes.violent || 0) > threshold) reasons.push('bạo lực');
                    if ((classes.insulting || 0) > threshold) reasons.push('xúc phạm');
                    if ((classes.discriminatory || 0) > threshold) reasons.push('phân biệt đối xử');
                    if ((classes['self-harm'] || 0) > threshold) reasons.push('tự gây hại');
                    reason = `Phát hiện nội dung ${reasons.join(', ')}`;
                }

                return {
                    isSafe: !isToxic,
                    isSpoiler: false,
                    isToxic: isToxic,
                    reason,
                };
            }

            return { isSafe: true, isSpoiler: false, isToxic: false };

        } catch (error) {
            this.logger.error('Content Moderation Failed', error);
            return { isSafe: true, isSpoiler: false, isToxic: false };
        }
    }
}

