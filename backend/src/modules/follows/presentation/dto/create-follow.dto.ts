import {
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { CreateFollowCommand } from '../../application/commands/create-follow/create-follow.command';
import { GetFollowsQuery } from '../../application/queries/get-follows/get-follows.query';

export class CreateFollowDto {
  @IsUUID('4')
  @IsNotEmpty()
  targetId!: string;

  toCommand(actor: Actor): CreateFollowCommand {
    return new CreateFollowCommand(actor, this.targetId);
  }
}

import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class FilterFollowDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsUUID('4')
  targetId?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  toQuery(actor: Actor) {
    return new GetFollowsQuery(
      actor,
      this.userId,
      this.targetId,
      this.actualPage,
      this.actualLimit,
      'createdAt',
      'desc',
    );
  }
}
