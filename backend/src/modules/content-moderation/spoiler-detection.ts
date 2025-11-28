/**
 * Vietnamese Spoiler Detection
 * Detects content that reveals plot points
 */

// Spoiler indicator patterns
const SPOILER_PATTERNS = [
    // Chapter references with outcomes
    /chương\s+\d+.*?(chết|sống|hồi sinh|kết hôn|ly hôn|chia tay|về với|phản bội)/i,
    /chapter\s+\d+.*?(die|dies|died|death|alive|live|marry|married|divorce|betray|betrayed|kill|killed)/i,

    // Character fate reveals
    /(nam chính|nữ chính|nhân vật chính|main character|protagonist).*?(chết|sống|kết hôn|về với|chia tay|bị giết|giết|chết)/i,
    /(male lead|female lead|main character|protagonist).*?(die|dies|died|marry|marries|married|divorce|divorces|betray|betrays|betrayed|kill|kills|killed)/i,

    // Ending spoilers
    /(kết thúc|ending|cuối cùng|finally|in the end).*?(chết|sống|về với|kết hôn|có thai|sinh con)/i,
    /(happy ending|sad ending|bad ending|good ending|tragic ending)/i,

    // Plot reveals
    /thực ra.*?(là|không phải|chính là)/i,
    /actually.*?(is|isn't|the real)/i,
    /spoiler.*?:/i,
    /reveals?.*?that/i,
];

// Spoiler keywords
const SPOILER_KEYWORDS = [
    'spoiler',
    'spoil',
    'tiết lộ cốt truyện',
    'leak plot',
    'plot twist',
];

/**
 * Check if content contains spoilers
 * Returns true if spoiler detected
 */
export function containsSpoilers(text: string): boolean {
    if (!text) return false;

    const normalized = text.toLowerCase().trim();

    // Check for explicit spoiler keywords
    for (const keyword of SPOILER_KEYWORDS) {
        if (normalized.includes(keyword.toLowerCase())) {
            return true;
        }
    }

    // Check for spoiler patterns
    for (const pattern of SPOILER_PATTERNS) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
}
