export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // Xóa các ký tự đặc biệt
  str = str.replace(/[^a-z0-9 ]/g, '');
  return str.trim().replace(/\s+/g, ' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Tính điểm tương đồng (0-100) giữa câu truy vấn và chuỗi mục tiêu.
 * Bao gồm cả đối sánh theo token và levenshtein distance.
 */
export function calculateFuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const normalizedQuery = removeVietnameseAccents(query);
  const normalizedTarget = removeVietnameseAccents(target);

  if (normalizedQuery === normalizedTarget) return 100;
  if (normalizedTarget.startsWith(normalizedQuery)) return 90;
  if (normalizedTarget.includes(normalizedQuery)) return 80;

  const queryTokens = normalizedQuery.split(' ');
  const targetTokens = normalizedTarget.split(' ');

  let matchTokens = 0;

  for (const qToken of queryTokens) {
    if (qToken.length < 2) continue; // Skip very short tokens

    let bestDist = qToken.length;
    for (const tToken of targetTokens) {
      if (tToken === qToken) {
        bestDist = 0;
        break;
      }
      const dist = levenshteinDistance(qToken, tToken);
      if (dist < bestDist) {
        bestDist = dist;
      }
    }

    // Yêu cầu chặt chẽ hơn cho việc tính match
    if (bestDist === 0) {
      matchTokens++;
    } else if (bestDist === 1 && qToken.length >= 4) {
      matchTokens++; // Typo nhẹ (1 ký tự sai) cho từ có 4 chữ cái trở lên
    } else if (bestDist <= 2 && qToken.length >= 7) {
      matchTokens++; // Typo cho từ rất dài
    }
  }

  // Filter out short tokens for length count
  const validQueryTokens = queryTokens.filter((t) => t.length >= 2);
  const totalTokens = validQueryTokens.length > 0 ? validQueryTokens.length : 1;

  if (matchTokens === totalTokens) {
    return 70; // Tất cả các từ đều có mặt (dù có thể sai chính tả nhẹ hoặc sai thứ tự)
  }

  if (matchTokens > 0) {
    return Math.floor((matchTokens / totalTokens) * 60);
  }

  // Fallback to full string levenshtein for very short queries
  const dist = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLen = Math.max(normalizedQuery.length, normalizedTarget.length);
  const similarity = Math.max(0, 1 - dist / maxLen);

  if (similarity > 0.8) return 60;

  return 0;
}
