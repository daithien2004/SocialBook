import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IFollowRepository } from "@/domain/follows/repositories/follow.repository.interface";
import { UserId } from "@/domain/follows/value-objects/user-id.vo";
import { TargetId } from "@/domain/follows/value-objects/target-id.vo";
import { Injectable, Logger } from "@nestjs/common";

export class GetFollowStatusQuery extends Query<{ userId: string; targetId: string; isFollowing: boolean; isOwner: boolean; followId: string | undefined; }> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();}
}
