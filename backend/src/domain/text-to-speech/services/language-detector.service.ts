import { Injectable } from '@nestjs/common';

export interface LanguageDetectionResult {
  code: string;
  voice: string;
  name: string;
}

@Injectable()
export class LanguageDetectorService {
  private readonly vietnamesePattern =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  detect(text: string): LanguageDetectionResult {
    if (this.vietnamesePattern.test(text)) {
      return { code: 'vi-VN', voice: 'vi-VN', name: 'Vietnamese' };
    }
    return { code: 'en-US', voice: 'en-US', name: 'English' };
  }
}
