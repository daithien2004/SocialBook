import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CheckUserExistHandler } from './use-cases/check-user-exist/check-user-exist.handler';
import { CreateUserHandler } from './use-cases/create-user/create-user.handler';
import { DeleteUserHandler } from './use-cases/delete-user/delete-user.handler';
import { GetReadingPreferencesHandler } from './use-cases/get-reading-preferences/get-reading-preferences.handler';
import { GetUserByIdHandler } from './use-cases/get-user-by-id/get-user-by-id.handler';
import { GetUserProfileHandler } from './use-cases/get-user-profile/get-user-profile.handler';
import { GetUsersHandler } from './use-cases/get-users/get-users.handler';
import { SearchUsersHandler } from './use-cases/search-users/search-users.handler';
import { ToggleBanHandler } from './use-cases/toggle-ban/toggle-ban.handler';
import { UpdateReadingPreferencesHandler } from './use-cases/update-reading-preferences/update-reading-preferences.handler';
import { UpdateUserHandler } from './use-cases/update-user/update-user.handler';
import { UpdateUserImageHandler } from './use-cases/update-user-image/update-user-image.handler';
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
