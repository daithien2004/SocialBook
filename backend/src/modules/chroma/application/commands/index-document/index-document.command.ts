import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class IndexDocumentCommand extends Command<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  constructor(
    public readonly actor: Actor,
    public readonly contentId: string,
    public readonly contentType: 'book' | 'author' | 'chapter',
    public readonly content: string,
    public readonly metadata?: Record<string, unknown>,
    public readonly embedding?: number[],
  ) {
    super();
  }
}
