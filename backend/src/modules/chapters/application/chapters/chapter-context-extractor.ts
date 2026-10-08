import { Paragraph } from '@/modules/chapters/domain/chapters/value-objects/paragraph.vo';

const MAX_CONTEXT_CHARS = 5000;

export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}<>/\\@#$%^&*\-_=+~`|]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  return new Set(words);
}

export function selectRelevantContent(
  paragraphs: Paragraph[],
  keywords: Set<string>,
): string {
  const scored = paragraphs.map((p, index) => {
    const content = p.content;
    let totalMatches = 0;

    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const matches = content.match(regex);
      if (matches) {
        totalMatches += matches.length;
      }
    }

    const totalWords = content.split(/\s+/).length;
    const score = totalWords > 0 ? totalMatches / totalWords : 0;

    return { index, content, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected: typeof scored = [];
  let currentLength = 0;

  for (const item of scored) {
    if (currentLength + item.content.length <= MAX_CONTEXT_CHARS) {
      selected.push(item);
      currentLength += item.content.length;
    } else if (selected.length === 0) {
      selected.push(item);
      break;
    } else {
      break;
    }
  }

  selected.sort((a, b) => a.index - b.index);

  return selected.map((s) => s.content).join('\n');
}

export function getChapterContext(
  paragraphs: Paragraph[],
  queryText: string,
): string {
  const totalContent = paragraphs.map((p) => p.content).join('\n');

  if (totalContent.length <= MAX_CONTEXT_CHARS) {
    return totalContent;
  }

  const keywords = extractKeywords(queryText);
  return selectRelevantContent(paragraphs, keywords);
}
