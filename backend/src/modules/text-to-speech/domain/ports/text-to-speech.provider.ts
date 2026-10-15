export interface AudioGenerationOptions {
  voice: string;
  language: string;
  speed?: number;
  format?: string;
}

export abstract class TextToSpeechProvider {
  abstract generateAudio(
    text: string,
    options: AudioGenerationOptions,
  ): Promise<{ audioUrl: string; format: string; duration?: number }>;
}
