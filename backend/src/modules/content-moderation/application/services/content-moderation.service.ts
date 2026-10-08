import { Injectable, Logger } from '@nestjs/common';
import { ModerationResult } from '@/modules/content-moderation/domain/interfaces/moderation-result.interface';
import { containsVietnameseToxicWords } from '@/modules/content-moderation/domain/utils/vietnamese-profanity';
import { IAIPort } from '@/modules/ai';

interface ModerationAIResult {
  action: 'ALLOW' | 'REVIEW' | 'BLOCK';
  category: 'toxic' | 'spoiler' | 'spam' | 'hate_speech' | 'none';
  score: number;
  reason: string;
}

const MODERATION_PROMPT = (text: string): string => `
Báº¡n lÃ  má»™t chuyÃªn gia kiá»ƒm duyá»‡t ná»™i dung cho máº¡ng xÃ£ há»™i vá» sÃ¡ch SocialBook - ná»n táº£ng dÃ nh cho ngÆ°á»i yÃªu sÃ¡ch vÃ  review vÄƒn há»c.

QUAN TRá»ŒNG: ÄÃ¢y lÃ  ná»n táº£ng sÃ¡ch. NgÆ°á»i dÃ¹ng thÆ°á»ng trÃ­ch dáº«n, tÃ³m táº¯t, hoáº·c review cÃ¡c tÃ¡c pháº©m vÄƒn há»c.
Ná»™i dung mÃ´ táº£ tÃ¬nh tiáº¿t trong truyá»‡n (báº¡o lá»±c, cÃ¡i cháº¿t, Ä‘au khá»•, thÃ¹ háº­n cá»§a NHÃ‚N Váº¬T HÆ¯ Cáº¤U) lÃ  HOÃ€N TOÃ€N BÃŒNH THÆ¯á»œNG vÃ  pháº£i Ä‘Æ°á»£c ALLOW.

Chá»‰ Ä‘Ã¡nh dáº¥u vi pháº¡m khi ná»™i dung:
1. toxic: Chá»©a tá»« ngá»¯ thÃ´ tá»¥c trá»±c tiáº¿p, xÃºc pháº¡m cÃ¡ nhÃ¢n tháº­t, hoáº·c kÃªu gá»i báº¡o lá»±c tháº­t sá»±. KHÃ”NG Ã¡p dá»¥ng cho mÃ´ táº£ vÄƒn há»c/hÆ° cáº¥u.
2. spoiler: Tiáº¿t lá»™ tÃ¬nh tiáº¿t quan trá»ng cá»§a sÃ¡ch (káº¿t thÃºc, cÃ¡i cháº¿t nhÃ¢n váº­t, plot twist) mÃ  KHÃ”NG cÃ³ cáº£nh bÃ¡o "âš ï¸ SPOILER" hay "[SPOILER]" rÃµ rÃ ng.
3. spam: Ná»™i dung láº·p Ä‘i láº·p láº¡i vÃ´ nghÄ©a, quáº£ng cÃ¡o rÃ¡c khÃ´ng liÃªn quan Ä‘áº¿n sÃ¡ch.
4. hate_speech: KÃªu gá»i thÃ¹ ghÃ©t, phÃ¢n biá»‡t Ä‘á»‘i xá»­ vá»›i ngÆ°á»i THáº¬T (dÃ¢n tá»™c, tÃ´n giÃ¡o, giá»›i tÃ­nh). KHÃ”NG Ã¡p dá»¥ng cho cáº£m xÃºc cá»§a nhÃ¢n váº­t hÆ° cáº¥u.

VÃ­ dá»¥ PHáº¢I ALLOW:
- "NhÃ¢n váº­t chÃ­nh cÄƒm thÃ¹ káº» Ä‘Ã£ giáº¿t cha mÃ¬nh" â†’ cáº£m xÃºc hÆ° cáº¥u, khÃ´ng pháº£i hate speech
- "Cáº£nh chiáº¿n tráº­n Ä‘áº«m mÃ¡u trong chÆ°Æ¡ng 3" â†’ mÃ´ táº£ vÄƒn há»c
- "Anh áº¥y Ä‘au Ä‘á»›n, tuyá»‡t vá»ng trong phÃ²ng giam" â†’ tÃ¬nh tiáº¿t truyá»‡n

Ná»™i dung cáº§n Ä‘Ã¡nh giÃ¡:
"${text}"

HÃ£y tráº£ vá» káº¿t quáº£ dÆ°á»›i Ä‘á»‹nh dáº¡ng JSON sau:
{
  "action": "ALLOW" | "REVIEW" | "BLOCK",
  "category": "toxic" | "spoiler" | "spam" | "hate_speech" | "none",
  "score": number (0-100),
  "reason": "Giáº£i thÃ­ch ngáº¯n gá»n báº±ng tiáº¿ng Viá»‡t lÃ½ do vi pháº¡m (náº¿u cÃ³), náº¿u an toÃ n hÃ£y tráº£ vá» chuá»—i rá»—ng"
}

Quy táº¯c quyáº¿t Ä‘á»‹nh (action):
- ALLOW: Ná»™i dung an toÃ n, bao gá»“m cáº£ ná»™i dung vÄƒn há»c tá»‘i tÄƒm nhÆ°ng khÃ´ng vi pháº¡m cÃ¡c tiÃªu chÃ­ trÃªn.
- REVIEW: CÃ³ nghi váº¥n spoiler khÃ´ng rÃµ rÃ ng, hoáº·c ná»™i dung nháº¡y cáº£m cáº§n admin xem xÃ©t.
- BLOCK: Vi pháº¡m rÃµ rÃ ng vÃ  nghiÃªm trá»ng (tá»« tá»¥c trá»±c tiáº¿p, hate speech tháº­t, spam).
`;

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(private readonly aiService: IAIPort) {}

  async checkContent(text: string): Promise<ModerationResult> {
    if (!text?.trim()) {
      return this.safeResult();
    }

    const quickCheck = containsVietnameseToxicWords(text);
    if (quickCheck) {
      this.logger.debug(
        `[Regex] PhÃ¡t hiá»‡n ná»™i dung thÃ´ tá»¥c: ${quickCheck.group}`,
      );
      return {
        isSafe: false,
        isSpoiler: false,
        isToxic: true,
        action: 'BLOCK',
        category: 'toxic',
        score: 100,
        matchedWord: quickCheck.matchedWord,
        reason: `Ná»™i dung chá»©a tá»« ngá»¯ thÃ´ tá»¥c khÃ´ng phÃ¹ há»£p: "${quickCheck.matchedWord}" (nhÃ³m: ${quickCheck.group}).`,
      };
    }

    try {
      this.logger.debug(
        `[AI] Äang Ä‘Ã¡nh giÃ¡ ná»™i dung: "${text.substring(0, 50)}..."`,
      );

      const result = await this.aiService.generateJSON<ModerationAIResult>(
        MODERATION_PROMPT(text),
      );

      const isSafe = result.action === 'ALLOW';
      const isToxic =
        result.category === 'toxic' || result.category === 'hate_speech';
      const isSpoiler = result.category === 'spoiler';

      if (!isSafe) {
        this.logger.log(`[AI] Flagged [${result.action}]: ${result.reason}`);
      }

      return {
        isSafe,
        isSpoiler,
        isToxic,
        action: result.action,
        category: result.category,
        score: result.score ?? 0,
        reason: result.reason,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Lá»—i khi gá»i AI kiá»ƒm duyá»‡t ná»™i dung: ${message}`,
        stack,
      );

      return {
        isSafe: false,
        isSpoiler: false,
        isToxic: false,
        action: 'REVIEW',
        category: 'none',
        score: 0,
        reason:
          'Há»‡ thá»‘ng kiá»ƒm duyá»‡t AI táº¡m thá»i giÃ¡n Ä‘oáº¡n, ná»™i dung Ä‘Æ°á»£c chuyá»ƒn qua Admin kiá»ƒm tra.',
      };
    }
  }

  private safeResult(): ModerationResult {
    return {
      isSafe: true,
      isSpoiler: false,
      isToxic: false,
      action: 'ALLOW',
      category: 'none',
      score: 0,
    };
  }
}
