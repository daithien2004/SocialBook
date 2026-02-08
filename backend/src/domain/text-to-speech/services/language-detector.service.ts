export class LanguageDetectorService {
    static detect(text: string): { code: string; voice: string; name: string } {
        const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        const hasVietnamese = vietnamesePattern.test(text);

        if (hasVietnamese) {
            return {
                code: 'vi-VN',
                voice: 'vi-VN',
                name: 'Vietnamese',
            };
        }

        return {
            code: 'en-US',
            voice: 'en-US',
            name: 'English',
        };
    }
}
