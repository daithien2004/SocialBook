import { Command } from '@nestjs/cqrs';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import type { Actor } from '@/shared/casl/actor';
import type { ToggleLikeResult } from '@/modules/likes/application/like.result';
export class ToggleLikeCommand extends Command<ToggleLikeResult> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly targetType: TargetType,
    public readonly deferNotification = false,
  ) {
    super();
  }
}
