import { Command } from '@nestjs/cqrs';

export class IndexDocumentCommand extends Command<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  constructor(
    public readonly contentId: string,
    public readonly contentType: string,
    public readonly content: string,
    public readonly metadata?: Record<string, any>,
    public readonly embedding?: number[],
  ) {
    super();
  }
}
