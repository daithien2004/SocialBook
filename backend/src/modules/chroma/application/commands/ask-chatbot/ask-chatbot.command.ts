import { Command } from '@nestjs/cqrs';

import type { AskChatbotResult } from '@/modules/chroma/application/chroma.result';
import type { Actor } from '@/shared/casl/actor';

export class AskChatbotCommand extends Command<AskChatbotResult> {
  constructor(
    public readonly actor: Actor,
    public readonly question: string,
  ) {
    super();
  }
}
