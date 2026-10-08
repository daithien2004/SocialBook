export const AI_PROVIDER_NAMES = {
  GEMINI: 'gemini',
  CHATGPT: 'chatgpt',
} as const;

export type AIProviderName =
  (typeof AI_PROVIDER_NAMES)[keyof typeof AI_PROVIDER_NAMES];

export abstract class IAIProviderPort {
  abstract generateText(prompt: string, systemPrompt?: string): Promise<string>;
  abstract generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
  abstract embedText(text: string): Promise<number[]>;
  abstract getProviderName(): AIProviderName;
}
