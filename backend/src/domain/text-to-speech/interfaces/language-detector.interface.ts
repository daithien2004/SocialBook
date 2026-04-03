export interface LanguageDetectionResult {
  code: string;
  voice: string;
  name: string;
}

export interface ILanguageDetector {
  detect(text: string): LanguageDetectionResult;
}
