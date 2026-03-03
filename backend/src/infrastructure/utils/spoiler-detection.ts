/**
 * Vietnamese Spoiler Detection
 * Detects content that reveals plot points
 */

// Spoiler indicator patterns
const SPOILER_PATTERNS = [
    // Chapter references with outcomes (chương ... chết/cưới/...)
    /chương\s+\d+.*?(chết|sống|hồi sinh|kết hôn|ly hôn|cưới|lấy nhau|thành đôi|chia tay|về với|phản bội|bỏ nhau)/i,
    /chapter\s+\d+.*?(die|dies|died|death|alive|live|marry|married|divorce|betray|betrayed|kill|killed)/i,

    // Character fate reveals (nam chính/main ... chết/cưới)
    /(nam chính|nữ chính|nhân vật chính|main|nvc|na9|nu9|nam 9|nữ 9|protagonist).*?(chết|sẽ chết|bị giết|hy sinh|tử trận|bay màu|sống|kết hôn|ly hôn|cưới|về với|thành đôi|chia tay|giết|bị đâm|phản bội|bỏ nhau)/i,
    /(male lead|female lead|main character|protagonist).*?(die|dies|died|dead|death|will die|will be dead|gonna die|going to die|marry|marries|married|divorce|divorces|betray|betrays|betrayed|kill|kills|killed|will kill|will be killed|gets killed|will be betrayed|will betray|betrayed|betray|betrayed|betray|betrayed|betray)/i,

    // Ending spoilers (kết thúc/cuối ... chết/cưới)
    /(kết thúc|ending|cuối cùng|cuối truyện|kết truyện|hết truyện|finally|in the end).*?(chết|sống|về với|bên nhau|thành đôi|kết hôn|cưới|có thai|sinh con|có hậu|bi thảm|buồn|vui vẻ|hạnh phúc)/i,
    /(happy ending|sad ending|bad ending|good ending|tragic ending|he|se|oe|kết thúc có hậu|kết thúc buồn|kết thúc bi thảm|kết thúc vui vẻ)/i,

    // Plot reveals
    /(thực ra|hóa ra|sự thật là|bật mí).*?(là|không phải|chính là|mới là)/i,
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
