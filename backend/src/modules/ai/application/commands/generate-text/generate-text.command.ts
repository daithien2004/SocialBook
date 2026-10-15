import { Command } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';
import type { GenerateTextResult } from '@/modules/ai/application/ai.result';

export class GenerateTextCommand extends Command<GenerateTextResult> {
  constructor(
    public readonly prompt: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
