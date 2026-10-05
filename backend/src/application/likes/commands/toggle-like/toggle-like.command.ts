import { Command } from '@nestjs/cqrs';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { ToggleLikeResult } from './toggle-like.handler';
export class ToggleLikeCommand extends Command<ToggleLikeResult> {
  constructor(public readonly userId: string, public readonly targetId: string, public readonly targetType: TargetType) { super(); }
}
