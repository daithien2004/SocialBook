import {
  Prisma,
  AIRequest as AIRequestRow,
} from '@/core/database/generated/prisma/client';
import { AIRequest, AIRequestType } from '@/modules/ai/domain';

const AI_REQUEST_TYPES = [
  AIRequestType.TEXT_GENERATION,
  AIRequestType.JSON_GENERATION,
  AIRequestType.CHAPTER_SUMMARY,
  AIRequestType.BOOK_RECOMMENDATION,
  AIRequestType.READING_ANALYSIS,
  AIRequestType.KEYWORD_EXTRACTION,
  AIRequestType.TITLE_GENERATION,
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class AIRequestMapper {
  static toDomain(row: AIRequestRow): AIRequest {
    return AIRequest.reconstitute({
      id: row.id,
      prompt: row.prompt,
      response: row.response,
      type: this.toRequestType(row.type),
      userId: row.userId,
      metadata: this.toMetadata(row.metadata),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toCreateInput(
    request: AIRequest,
  ): Prisma.AIRequestUncheckedCreateInput {
    return {
      id: request.id.toString(),
      prompt: request.prompt,
      response: request.response,
      type: request.type,
      userId: request.userId.toString(),
      metadata: this.toJsonObject(request.metadata),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  private static toRequestType(value: string): AIRequestType {
    const requestType = AI_REQUEST_TYPES.find(
      (candidate) => candidate.valueOf() === value,
    );
    if (!requestType) throw new Error(`Unknown AI request type: ${value}`);
    return requestType;
  }

  private static toMetadata(value: Prisma.JsonValue): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('AI request metadata must be a JSON object');
    }
    return value;
  }

  private static toJsonObject(
    value: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, this.toJsonValue(item)]),
    );
  }

  private static toJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null) return null;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.toJsonValue(item));
    }
    if (isRecord(value)) {
      return this.toJsonObject(value);
    }
    throw new Error('AI request metadata contains a non-JSON value');
  }
}
