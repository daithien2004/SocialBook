import { Module } from '@nestjs/common';
import { CommentsApplicationModule } from './application/comments-application.module';
import { CommentsController } from './presentation/comments.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineCommentAbilities } from './application/policies/comment.ability';

@Module({
  imports: [CommentsApplicationModule],
  controllers: [CommentsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineCommentAbilities]),
    },
    PoliciesGuard,
  ],
})
export class CommentsModule {}
