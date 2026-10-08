export { LikesModule } from './likes.module';
export { LikesApplicationModule } from './application/likes-application.module';
export { LikesInfrastructureModule } from './infrastructure/likes-infrastructure.module';
export { ToggleLikeCommand } from './application/commands/toggle-like/toggle-like.command';
export { ILikeRepository } from './domain/repositories/like.repository.interface';
export { Like as LikeEntity } from './domain/entities/like.entity';
export { TargetType } from './domain/value-objects/target-type.vo';
export { TargetId } from './domain/value-objects/target-id.vo';
export {
  Like as LikeSchemaModel,
  LikeSchema,
} from './infrastructure/schemas/like.schema';
export type { LikeDocument } from './infrastructure/schemas/like.schema';
