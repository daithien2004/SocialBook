import { normalizeForModeration } from './text-normalization';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToxicMatch {
  pattern: string;
  group: string;
  input: 'original' | 'normalized';
}

// ─── Pattern Groups ───────────────────────────────────────────────────────────

interface PatternGroup {
  group: string;
  /** Chạy trên text GỐC (có dấu tiếng Việt) */
  raw?: RegExp[];
  /** Chạy trên text ĐÃ normalize (bỏ dấu, leet → letter) */
  normalized?: RegExp[];
}

const PATTERN_GROUPS: PatternGroup[] = [
  {
    group: 'dit/du/dm',
    raw: [
      /đ[ịi]t/i,           // địt
      /đụ/i,               // đụ
      /đ[éè]\s*m/i,        // đéo mẹ
    ],
    normalized: [
      // Sau khi normalize: đ→d, bỏ dấu
      // Bắt: djt, d1t, d-i-t, d.i.t, d*t
      /d[\s.\-_*]*[i1j*][\s.\-_*]*t/i,
      // Bắt: dm, d.m, d-m (abbreviation)
      /\bd[\s.\-_*]*m\b/i,
    ],
  },

  {
    group: 'lon',
    raw: [
      /l[ồổõọo]n/i,        // lồn, lổn, lõn...
    ],
    normalized: [
      // Bắt: l0n, l*n, l o n, l-o-n, l*n
      /l[\s.\-_*0]*[o0u*][\s.\-_*0]*n/i,
    ],
  },

  {
    group: 'cac/cut',
    raw: [
      /c[ặắầấ]c/i,         // cặc, cắc...
      /c[ứủũụu]t/i,        // cứt, củt...
    ],
    normalized: [
      // Bắt: c4c, c*c, cac, cuk
      /c[\s.\-_*]*[a4u*][\s.\-_*]*[ck]/i,
      // Bắt: cut, c-u-t
      /c[\s.\-_*]*[u*][\s.\-_*]*t/i,
    ],
  },

  {
    group: 'vcl/vkl',
    raw: [
      /v[ã]\s*i?\s*l[ồổ]n/i,  // vãi lồn, vãi lồn...
    ],
    normalized: [
      // Bắt: vcl, vkl — nhưng phải là word boundary để tránh "vocal"
      /\bv[ck]l\b/i,
    ],
  },

  {
    group: 'ngu/idiot',
    raw: [
      /\bng[uú]+\b/i,      // ngu, ngú — word boundary tránh "ngủ dậy"
      /\bđần\b/i,
      /\bbần\s*tiện\b/i,
    ],
    normalized: [
      /\bn[\s.\-_*]*[gq][\s.\-_*]*u+\b/i,
    ],
  },

  {
    group: 'threat/family-insult',
    raw: [
      /m[eẹ]\s*m[àa]y/i,        // mẹ mày
      /b[ốo]\s*m[àa]y/i,        // bố mày
      /gi[eế]t\s*m[àa]y/i,      // giết mày
      /đ[eé]\s*m[àa]y/i,        // đéo mày
    ],
  },
];

// ─── Main Detection ───────────────────────────────────────────────────────────

/**
 * Kiểm tra text có chứa nội dung toxic không.
 * Trả về match đầu tiên tìm được, hoặc null nếu sạch.
 */
export function containsVietnameseToxicWords(text: string): ToxicMatch | null {
  if (!text?.trim()) return null;

  const normalized = normalizeForModeration(text);

  for (const { group, raw, normalized: normalizedPatterns } of PATTERN_GROUPS) {
    // 1. Check raw text (accent-aware)
    for (const pattern of raw ?? []) {
      if (pattern.test(text)) {
        return { pattern: pattern.source, group, input: 'original' };
      }
    }

    // 2. Check normalized text (leet/bypass-aware)
    for (const pattern of normalizedPatterns ?? []) {
      if (pattern.test(normalized)) {
        return { pattern: pattern.source, group, input: 'normalized' };
      }
    }
  }

  return null;
}

/**
 * Lấy tất cả matches (dùng cho logging/analytics)
 */
export function getAllToxicMatches(text: string): ToxicMatch[] {
  if (!text?.trim()) return [];

  const normalized = normalizeForModeration(text);
  const matches: ToxicMatch[] = [];

  for (const { group, raw, normalized: normalizedPatterns } of PATTERN_GROUPS) {
    for (const pattern of raw ?? []) {
      if (pattern.test(text)) {
        matches.push({ pattern: pattern.source, group, input: 'original' });
      }
    }
    for (const pattern of normalizedPatterns ?? []) {
      if (pattern.test(normalized)) {
        matches.push({ pattern: pattern.source, group, input: 'normalized' });
      }
    }
  }

  return matches;
}
