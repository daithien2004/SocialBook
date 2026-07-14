export interface ToxicMatch {
  pattern: string;
  group: string;
  matchedWord: string;
  input: 'original' | 'normalized';
}

interface PatternGroup {
  group: string;
  raw?: RegExp[];
}

let EXTREME_PROFANITY: PatternGroup[] = [];

/**
 * Cập nhật lại bộ nhớ đệm Regex từ danh sách ToxicWord trên DB
 * Được gọi lúc khởi động và khi có thay đổi (Add/Delete) qua Event Emitter
 */
export function updateToxicWordsCache(
  words: { pattern: string; group: string }[],
) {
  // Nhóm các từ lại theo group
  const grouped = words.reduce(
    (acc, word) => {
      if (!acc[word.group]) {
        acc[word.group] = [];
      }
      acc[word.group].push(word.pattern);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Parse thành mảng PatternGroup với RegExp
  EXTREME_PROFANITY = Object.entries(grouped).map(([group, patterns]) => ({
    group,
    raw: patterns.map((pattern) => new RegExp(pattern, 'i')),
  }));
}

export function containsVietnameseToxicWords(text: string): ToxicMatch | null {
  if (!text?.trim()) return null;

  for (const { group, raw } of EXTREME_PROFANITY) {
    for (const pattern of raw ?? []) {
      const match = pattern.exec(text);
      if (match) {
        return {
          pattern: pattern.source,
          group,
          matchedWord: match[0],
          input: 'original',
        };
      }
    }
  }

  return null;
}
