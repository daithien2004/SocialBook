
// Common Vietnamese profanity and toxic terms
export const VIETNAMESE_TOXIC_WORDS = [
    // Profanity - Variations, no accent, spaced, masked
    'dm', 'dmm', 'dmml', 'dmm', 'dml', 'djt', 'dit me', 'dit me may', 'dit me m',
    'deo', 'deo the', 'deo hieu', 'de0', 'd3o',
    'lon', 'cacl', 'cak', 'cakc', 'cak',
    'cl', 'c*l', 'l0n', 'l*n', 'clm', 'clmm', 'clmml',
    'cc', 'c*c', 'c*c', 'c**',
    'vl', 'vkl', 'v~l', 'vllll', 'vleu',

    // Strong insults
    'ngu lồn',
    'cái đồ mất nết',
    'đồ điếm thúi',
    'đồ mất dạy',
    'mất nết',
    'đồ láo toét',
    'láo chó',
    'hỗn láo',
    'bất hiếu',
    'khốn nạn',
    'đểu cáng',
    'đê tiện',
    'đồ hèn',
    'đồ tồi',
    'tồi tệ',
    'đồ mặt dày',
    'mặt chó',
    'mặt l*n',
    'mặt như cái bồn cầu',

    // Threat / Aggressive expressions
    'tao giết mày',
    'đập chết',
    'đấm vỡ mặt',
    'đấm chết',
    'tát vỡ mồm',
    'chặt đầu',
    'cắt cổ',
    'giết mẹ mày',
    'đập cho vỡ mặt',
    'đập cho sml',
    'cho mày ăn đấm',
    'bố sút mày',

    // Family insults
    'bố mày',
    'ông nội mày',
    'cha mày',
    'mẹ mày',
    'con mẹ mày',
    'đồ mất dạy giống mẹ mày',
    'bà nội mày',
    'đụ mẹ mày',
    'địt mẹ mày',

    // Animal-based insults (expanded)
    'đồ chó má',
    'con đĩ chó',
    'đồ khỉ',
    'đồ mọi rợ',
    'đồ đười ươi',
    'đồ trâu bò',
    'bò lú',
    'trâu đực',
    'phản trắc như chó',
    'cẩu nô tài',

    // Slang toxic – Gen Z style
    'óc chó vcl',
    'óc chó vl',
    'não phẳng',
    'não cún',
    'não cá vàng vcl',
    'não bò',
    'nohope',
    'trash',
    'đú trend ngu',
    'như cc',
    'mày bị ngu à',
    'adn ngu',
    'ngáo đá',
    'ngáo ngơ',
    'ngáo vl',
    'phèn vãi',
    'tục vãi',
    'bố tát cho hết ngu',
    'sml',
    'sấp mặt lờ',
    'lồi cu',
    'mày tuổi gì',

    // Sexual insults (expanded)
    'mặt lồn',
    'đồ dâm đãng',
    'dâm dê',
    'biến thái',
    'ấu dâm',
    'sex toy sống',
    'hám của lạ',
    'hám trai',
    'hám gái',
    'con đĩ rẻ tiền',
    'đồ lẳng lơ',
    'bà già dê',
    'dê xồm',
    'kích dục',
    'd*m',
    'dcmay',

    // Variants “tách chữ, biến thể, misspell cố tình”
    'đ m',
    'd m',
    'd.m',
    'd-m',
    'đ..m',
    'l o n',
    'l-0-n',
    'c a c',
    'đ ! t',
    'đ!t',
    'djt me',
    'fak',
    'phak',
    'lonz',
    'ch0',
    'ch0 m3',
    'm3 m@y',
    'ngu ngục',
    'nguu',
    'nqu',
    'nguu vl',
    'n.g.u',
    'n g u',

    // Hate speech
    'đồ mọi',
    'mọi rợ',
    'rác rưởi xã hội',
    'ký sinh trùng',
    'đồ bệnh hoạn',
    'đồ thấp kém',
    'đồ dị hợm',
    'loại cặn bã',

    // Toxic imperative
    'cút',
    'cút xéo',
    'cút mẹ mày đi',
    'biến',
    'biến mẹ đi',
    'câm',
    'câm mồm',
    'câm cái mồm chó lại',
    'im mẹ mày đi',
    'ngậm mồm',
    'câm lặng đi',
    'im cái họng chó',

    // Mocking / sarcasm insulting
    'đồ tấu hài',
    'mày hề thật sự',
    'ảo ma canada',
    'ảo thật đấy',
    'não cá vàng quốc dân',
    'đồ sống ảo',
    'đồ lừa lọc',
];

/**
 * Normalize Vietnamese text for comparison
 * Removes accents and converts to lowercase
 */
export function normalizeVietnamese(text: string): string {
    if (!text) return '';

    // Convert to lowercase
    let normalized = text.toLowerCase();

    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Remove dots, commas, special chars but keep letters and numbers
    normalized = normalized.replace(/[.,!?;:'"(){}[\]]/g, ' ');

    // Replace multiple spaces with single space
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text contains Vietnamese toxic words
 * Returns the matched word if found, null otherwise
 */
export function containsVietnameseToxicWords(text: string): string | null {
    const normalized = normalizeVietnamese(text);

    for (const word of VIETNAMESE_TOXIC_WORDS) {
        const normalizedWord = normalizeVietnamese(word);
        const escapedWord = escapeRegex(normalizedWord);

        // Check if the toxic word appears as a whole word or phrase
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
        if (regex.test(normalized) || normalized.includes(normalizedWord)) {
            return word; // Return the original toxic word that was matched
        }
    }

    return null;
}
