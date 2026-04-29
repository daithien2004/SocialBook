export function normalizeForModeration(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    // Bỏ dấu tiếng Việt (NFD decompose rồi strip combining marks)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Leet-speak normalization
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
