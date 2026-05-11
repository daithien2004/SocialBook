import { normalizeForModeration } from './text-normalization';

export interface ToxicMatch {
  pattern: string;
  group: string;
  input: 'original' | 'normalized';
}

interface PatternGroup {
  group: string;
  raw?: RegExp[];
}

/**
 * Danh sách các từ ngữ cực kỳ thô tục hoặc xúc phạm nặng cần chặn ngay lập tức.
 */
const EXTREME_PROFANITY: PatternGroup[] = [
  {
    group: 'thô tục mạnh',
    raw: [
      /đ[ịi]t\s*m/i,        
      /đ[éè]\s*m/i,        
      /l[ồổõọ]n/i,        
      /c[ặắầấ]c/i,
      /đ[ịi]t\s*c[ụu]/i,
      /v[ôô]n\s*l[àà]i/i,
    ],
  },
  {
    group: 'xúc phạm',
    raw: [
      /[óó]c\s*ch[óó]/i,
      /b[ệệ]nh\s*ho[ạạ]n/i,
      /ngu\s*v[cc]l/i,
      /đ[ôồ]ng\s*b[àà]i/i,
    ],
  },
];

export function containsVietnameseToxicWords(text: string): ToxicMatch | null {
  if (!text?.trim()) return null;

  for (const { group, raw } of EXTREME_PROFANITY) {
    for (const pattern of raw ?? []) {
      if (pattern.test(text)) {
        return { pattern: pattern.source, group, input: 'original' };
      }
    }
  }

  return null;
}
