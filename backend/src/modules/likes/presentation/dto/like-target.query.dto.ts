import { IsEnum, IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetLikeCountQuery } from '@/modules/likes/application/queries/get-like-count/get-like-count.query';
import { GetLikeStatusQuery } from '@/modules/likes/application/queries/get-like-status/get-like-status.query';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';

export class LikeTargetQueryDto {
  @IsUUID('4')
  targetId!: string;

  @IsEnum(TargetType)
  targetType!: TargetType;

  toCountQuery(actor: Actor): GetLikeCountQuery {
    return new GetLikeCountQuery(actor, this.targetId, this.targetType);
  }

  toStatusQuery(actor: Actor): GetLikeStatusQuery {
    return new GetLikeStatusQuery(actor, this.targetId, this.targetType);
  }
}
