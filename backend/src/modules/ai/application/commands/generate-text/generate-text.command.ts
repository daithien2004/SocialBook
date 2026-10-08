import { Command } from '@nestjs/cqrs';

import { GenerateTextResult } from '@/modules/ai/application/commands/generate-text/generate-text.handler';

export class GenerateTextCommand extends Command<GenerateTextResult> {
  constructor(
    public readonly prompt: string,
    public readonly userId: string,
  ) {
    super();
  }
}
