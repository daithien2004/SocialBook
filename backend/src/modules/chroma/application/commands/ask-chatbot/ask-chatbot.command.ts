import { Command } from '@nestjs/cqrs';

import { AskChatbotResult } from '@/modules/chroma/application/commands/ask-chatbot/ask-chatbot.handler';

export class AskChatbotCommand extends Command<AskChatbotResult> {
  constructor(public readonly question: string) {
    super();
  }
}
