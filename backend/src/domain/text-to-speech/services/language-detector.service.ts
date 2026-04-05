import {
  ILanguageDetector,
  LanguageDetectionResult,
} from '../interfaces/language-detector.interface';

export class LanguageDetectorService implements ILanguageDetector {
  detect(text: string): LanguageDetectionResult {
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
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
