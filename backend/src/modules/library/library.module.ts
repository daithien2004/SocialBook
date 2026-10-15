import { Module } from '@nestjs/common';
import { LibraryApplicationModule } from './application/library/library-application.module';
import { CollectionsController } from './presentation/collections/collections.controller';
import { LibraryController } from './presentation/library/library.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineLibraryAbilities } from './application/policies/library.ability';

@Module({
  imports: [LibraryApplicationModule],
  controllers: [CollectionsController, LibraryController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineLibraryAbilities]),
    },
    PoliciesGuard,
  ],
})
export class LibraryModule {}
