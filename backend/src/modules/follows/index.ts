export { FollowsModule } from './follows.module';
export { FollowsInfrastructureModule } from './infrastructure/follows-infrastructure.module';
export { IFollowRepository } from './domain/repositories/follow.repository.interface';
export type {
  FollowStatusResult,
  PaginatedFollowsWithUserInfo,
} from './domain/repositories/follow.repository.interface';
export { Follow as FollowEntity } from './domain/entities/follow.entity';
export { TargetId } from './domain/value-objects/target-id.vo';
export {
  Follow as FollowSchemaModel,
  FollowSchema,
} from './infrastructure/schemas/follow.schema';
export type { FollowDocument } from './infrastructure/schemas/follow.schema';
