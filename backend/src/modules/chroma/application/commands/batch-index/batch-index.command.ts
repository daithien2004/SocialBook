import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class BatchIndexCommand extends Command<{
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: { contentId: string; error: string }[];
}> {
  constructor(
    public readonly actor: Actor,
    public readonly contentIds: string[],
    public readonly contentType: string,
    public readonly forceReindex?: boolean,
  ) {
    super();
  }
}
