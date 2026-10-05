import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { IPostRepository } from "@/domain/posts/repositories/post.repository.interface";
import { IFollowRepository } from "@/domain/follows/repositories/follow.repository.interface";
import { TargetId } from "@/domain/follows/value-objects/target-id.vo";
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";

export class GetUserProfileQuery extends Query<{ id: string; username: string; image: string | undefined; bio: string | undefined; location: string | undefined; website: string | undefined; createdAt: Date; postCount: number; readingListCount: number; followersCount: number; }> {
  constructor(public readonly id: string) { super(); }
}
