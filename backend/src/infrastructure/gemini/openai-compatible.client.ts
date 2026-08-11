import { InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface OpenAICompatibleClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface EmbeddingResponse {
  data?: Array<{ embedding: number[] }>;
}

/**
 * Reusable HTTP client for any OpenAI-compatible API
 * (Beenoee, OpenAI, Azure OpenAI, etc.)
 */
export class OpenAICompatibleClient {
  private readonly logger = new Logger(OpenAICompatibleClient.name);
  private readonly http: AxiosInstance;
  private readonly model: string;

  constructor(config: OpenAICompatibleClientConfig) {
    this.model = config.model;
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 15_000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }

  /**
   * Send a user prompt and return plain text from the model.
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = systemPrompt
        ? [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ]
        : [{ role: 'user', content: prompt }];

      const response = await this.http.post<ChatCompletionResponse>(
        '/chat/completions',
        {
          model: this.model,
          messages,
        },
      );

      const content = response.data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new InternalServerErrorException(
          'AI API returned an empty response.',
        );
      }
      return content;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[generateText] ${message}`);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(`AI API error: ${message}`);
    }
  }

  /**
   * Send a prompt and parse the model's response as structured JSON.
   * Uses json_object response_format when supported.
   */
  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks, no extra text.`;

    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: jsonPrompt },
        ]
      : [{ role: 'user', content: jsonPrompt }];

    try {
      const response = await this.http.post<ChatCompletionResponse>(
        '/chat/completions',
        {
          model: this.model,
          messages,
          response_format: { type: 'json_object' },
        },
      );

      const content = response.data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new InternalServerErrorException(
          'AI API returned an empty response.',
        );
      }

      return this.parseJSON<T>(content);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[generateJSON] ${message}`);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(`AI API error: ${message}`);
    }
  }

  /**
   * Generate a vector embedding for the given text.
   * Requires the configured model to support the /embeddings endpoint.
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.http.post<EmbeddingResponse>('/embeddings', {
        model: this.model,
        input: text,
      });

      const embedding = response.data.data?.[0]?.embedding;
      if (!embedding?.length) {
        throw new InternalServerErrorException(
          'AI API returned an empty embedding.',
        );
      }
      return embedding;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[embedText] ${message}`);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(`AI API error: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private parseJSON<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Model sometimes wraps JSON in a markdown code block
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {
          // fall through to error below
        }
      }
      throw new InternalServerErrorException(
        `Could not parse JSON from AI response: ${raw.substring(0, 200)}`,
      );
    }
  }
}
