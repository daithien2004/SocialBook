export class VietnameseRegexBuilder {
  private static charMap: Record<string, string> | null = null;

  private static getCharMap(): Record<string, string> {
    if (this.charMap) return this.charMap;

    const groups: Record<string, string> = {
      '[aăâàáảãạằắẳẵặầấẩẫậ4@\\*]': 'aăâàáảãạằắẳẵặầấẩẫậ',
      '[eêèéẻẽẹềếểễệ3\\*]': 'eêèéẻẽẹềếểễệ',
      '[iìíỉĩị1!j\\*]': 'iìíỉĩị',
      '[oôơòóỏõọồốổỗộờớởỡợ0\\*]': 'oôơòóỏõọồốổỗộờớởỡợ',
      '[uưùúủũụừứửữựv\\*]': 'uưùúủũụừứửữự',
      '[yỳýỷỹỵ\\*]': 'yỳýỷỹỵ',
      '[dđ]': 'dđ',
      '[ck]': 'ck',
      '[gq]': 'gq',
      '[sx]': 'sx',
    };

    const map: Record<string, string> = {};
    for (const [pattern, chars] of Object.entries(groups)) {
      for (const char of chars) {
        map[char] = pattern;
      }
    }
    this.charMap = map;
    return map;
  }

  /**
   * Chuyển đổi một từ tiếng Việt bình thường thành Regex bắt được các biến thể (teencode, viết cách chữ)
   * Ví dụ: "địt" -> "đ[iìíỉĩị1!j][\\s\\.\\-\\_\\*]*t"
   */
  public static buildRegex(rawWord: string): string {
    const normalized = rawWord.trim().toLowerCase();
    if (!normalized) return '';

    let regexStr = '';

    // Lặp qua từng ký tự của từ gốc
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];

      // Nếu là khoảng trắng, cho phép lặp khoảng trắng hoặc các ký tự phân tách
      if (char === ' ') {
        regexStr += '[\\s\\.\\-\\_\\*]+';
        continue;
      }

      // Tra cứu ký tự trong bộ map, nếu không có thì giữ nguyên (cần escape nếu là ký tự đặc biệt)
      const map = this.getCharMap();
      const mappedChar = map[char] || this.escapeRegExp(char);
      regexStr += mappedChar;

      // Thêm ký tự phân cách linh hoạt giữa CÁC chữ cái trong một từ
      // Không thêm ở cuối cùng
      if (i < normalized.length - 1 && normalized[i + 1] !== ' ') {
        regexStr += '[\\s\\.\\-\\_\\*]*';
      }
    }
    const vietBoundary = '[\\u00C0-\\u024F\\u1E00-\\u1EFFa-zA-Z]';
    return `(?<!${vietBoundary})${regexStr}(?!${vietBoundary})`;
  }

  private static escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}
