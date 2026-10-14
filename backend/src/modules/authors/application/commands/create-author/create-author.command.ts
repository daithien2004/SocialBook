import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';

export class CreateAuthorCommand extends Command<string> {
  constructor(
    readonly actor: Actor,
    readonly name: string,
    readonly bio?: string,
    readonly photoUrl?: string,
    readonly photo?: MediaUploadFile,
  ) {
    super();
  }
}
