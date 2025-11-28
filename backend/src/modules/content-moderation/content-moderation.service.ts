import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { containsVietnameseToxicWords } from './vietnamese-profanity';
import { containsSpoilers } from './spoiler-detection';

export interface ModerationResult {
    isSafe: boolean;
    isSpoiler: boolean;
    isToxic: boolean;
    reason?: string;
}

@Injectable()
export class ContentModerationService {
    private readonly logger = new Logger(ContentModerationService.name);
    private readonly rapidApiKey: string;
    private readonly rapidApiHost: string;
    private readonly apiUrl: string;

    constructor(private configService: ConfigService) {
        this.rapidApiKey = this.configService.get<string>('RAPID_API_KEY') || '';
        this.rapidApiHost = this.configService.get<string>('RAPID_API_HOST') || 'nsfw-text-moderation-api.p.rapidapi.com';
        this.apiUrl = this.configService.get<string>('RAPID_API_URL') || 'https://nsfw-text-moderation-api.p.rapidapi.com/moderation_check.php';
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

            const result = await response.json();

            this.logger.debug(`RapidAPI Response: ${JSON.stringify(result)}`);

            // Check for moderation_classes (actual format from this API)
            if (result?.moderation_classes) {
                const classes = result.moderation_classes;

                // Check if any moderation score is above threshold (0.5)
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
                    if (classes.toxic > threshold) reasons.push('độc hại');
                    if (classes.sexual > threshold) reasons.push('tình dục');
                    if (classes.violent > threshold) reasons.push('bạo lực');
                    if (classes.insulting > threshold) reasons.push('xúc phạm');
                    if (classes.discriminatory > threshold) reasons.push('phân biệt đối xử');
                    if (classes['self-harm'] > threshold) reasons.push('tự gây hại');
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
