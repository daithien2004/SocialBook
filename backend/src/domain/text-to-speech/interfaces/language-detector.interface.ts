export interface LanguageDetectionResult {
  code: string;
  voice: string;
  name: string;
}

export abstract class ILanguageDetector {
  abstract detect(text: string): LanguageDetectionResult;
}
