import { Command } from '@nestjs/cqrs';

export class BatchIndexCommand extends Command<{
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: { contentId: string; error: string }[];
}> {
  constructor(
    public readonly contentIds: string[],
    public readonly contentType: string,
    public readonly forceReindex?: boolean,
  ) {
    super();
  }
}
