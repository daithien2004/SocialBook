import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CheckUserExistHandler } from './commands/check-user-exist/check-user-exist.handler';
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { GetReadingPreferencesHandler } from './queries/get-reading-preferences/get-reading-preferences.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id/get-user-by-id.handler';
import { GetUserProfileHandler } from './queries/get-user-profile/get-user-profile.handler';
import { GetUsersHandler } from './queries/get-users/get-users.handler';
import { SearchUsersHandler } from './commands/search-users/search-users.handler';
import { ToggleBanHandler } from './commands/toggle-ban/toggle-ban.handler';
import { UpdateReadingPreferencesHandler } from './commands/update-reading-preferences/update-reading-preferences.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { UpdateUserImageHandler } from './commands/update-user-image/update-user-image.handler';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { FollowsRepositoryModule } from '@/infrastructure/database/repositories/follows/follows-repository.module';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { MediaInfrastructureModule } from '@/infrastructure/media/media-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { PasswordHasherModule } from '@/shared/infrastructure/password-hasher.module';
import { CaslCacheListener } from './listeners/casl-cache.listener';

@Module({
  imports: [
    CqrsModule,
    UsersRepositoryModule,
    PostsRepositoryModule,
    FollowsRepositoryModule,
    LibraryRepositoryModule,
    MediaInfrastructureModule,
    IdGeneratorModule,
    PasswordHasherModule,
  ],
  providers: [
    CheckUserExistHandler,
    CreateUserHandler,
    DeleteUserHandler,
    GetReadingPreferencesHandler,
    GetUserByIdHandler,
    GetUserProfileHandler,
    GetUsersHandler,
    SearchUsersHandler,
    ToggleBanHandler,
    UpdateReadingPreferencesHandler,
    UpdateUserHandler,
    UpdateUserImageHandler,
    CaslCacheListener,
  ],
  exports: [
    CheckUserExistHandler,
    CreateUserHandler,
    DeleteUserHandler,
    GetReadingPreferencesHandler,
    GetUserByIdHandler,
    GetUserProfileHandler,
    GetUsersHandler,
    SearchUsersHandler,
    ToggleBanHandler,
    UpdateReadingPreferencesHandler,
    UpdateUserHandler,
    UpdateUserImageHandler,
  ],
})
export class UsersApplicationModule {}
