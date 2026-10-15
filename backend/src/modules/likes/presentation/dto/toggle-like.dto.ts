import { IsEnum, IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { ToggleLikeCommand } from '@/modules/likes/application/commands/toggle-like/toggle-like.command';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';

export class ToggleLikeDto {
  @IsUUID('4')
  targetId!: string;

  @IsEnum(TargetType)
  targetType!: TargetType;

  toCommand(actor: Actor): ToggleLikeCommand {
    return new ToggleLikeCommand(actor, this.targetId, this.targetType);
  }
}
