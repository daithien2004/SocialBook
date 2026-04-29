import { normalizeForModeration } from './text-normalization';

/**
 * Vietnamese Spoiler Detection
 *
 * Strategy:
 * 1. Check raw text against accent-aware patterns
 * 2. Normalize then check for variations
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpoilerMatch {
  pattern: string;
  group: string;
  input: 'original' | 'normalized';
}

// ─── Pattern Groups ───────────────────────────────────────────────────────────

interface PatternGroup {
  group: string;
  raw?: RegExp[];
  normalized?: RegExp[];
}

const PATTERN_GROUPS: PatternGroup[] = [
  {
    group: 'chapter-outcome',
    raw: [
      /(chương|chap|tập)\s+\d+.*?(chết|sống|cưới|ly hôn|phản bội|giết|kết hôn)/i,
    ],
    normalized: [
      /(chuong|chap|tap)\s+\d+.*?(chet|song|cuoi|ly hon|phan boi|giet|ket hon)/i,
    ],
  },
  {
    group: 'character-fate',
    raw: [
      /(nam chính|nữ chính|main|na9|nu9|nvc).*?(chết|sống|kết hôn|cưới|hy sinh|tử trận|bay màu)/i,
    ],
    normalized: [
      /(nam chinh|nu chinh|main|na9|nu9|nvc).*?(chet|song|ket hon|cuoi|hy sinh|tu tran|bay mau)/i,
    ],
  },
  {
    group: 'ending',
    raw: [
      /(kết thúc|cuối cùng|cuối truyện|kết truyện|hết truyện).*?(chết|sống|thành đôi|kết hôn|có hậu|bi thảm)/i,
    ],
    normalized: [
      /(ket thuc|cuoi cung|cuoi truyen|ket truyen|het truyen).*?(chet|song|thanh doi|ket hon|co hau|bi tham)/i,
      /\b(happy ending|sad ending|bad ending|he|se|oe)\b/i,
    ],
  },
  {
    group: 'explicit-tags',
    raw: [
      /(tiết lộ|hóa ra|sự thật là).*?(:|là|rằng)/i,
    ],
    normalized: [
      /(spoiler|spoil|leak|tiet lo|hoa ra|su that la).*?(:|la|rang)/i,
    ],
  },
];

// ─── Main Detection ───────────────────────────────────────────────────────────

/**
 * Check if text contains spoilers using structured pattern matching
 */
export function containsSpoilers(text: string): boolean {
  if (!text?.trim()) return false;

  const normalized = normalizeForModeration(text);

  for (const { raw, normalized: normalizedPatterns } of PATTERN_GROUPS) {
    // 1. Check raw text
    for (const pattern of raw ?? []) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // 2. Check normalized text
    for (const pattern of normalizedPatterns ?? []) {
      if (pattern.test(normalized)) {
        return true;
      }
    }
  }

  return false;
}
