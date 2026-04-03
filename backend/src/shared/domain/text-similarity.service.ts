export interface TextSimilarityResult {
  similarity: number;
}

export class TextSimilarityService {
  normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  calculate(query: string, targetText: string): number {
    if (!query || !targetText) return 0.0;

    const normalizedQuery = this.normalizeText(query);
    const normalizedTarget = this.normalizeText(targetText);

    if (normalizedTarget === normalizedQuery) {
      return 1.0;
    } else if (normalizedTarget.startsWith(normalizedQuery)) {
      return 0.8;
    } else if (normalizedTarget.includes(normalizedQuery)) {
      return 0.6;
    }
    return 0.0;
  }
}
