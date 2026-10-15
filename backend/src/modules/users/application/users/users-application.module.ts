import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CheckUserExistHandler } from './queries/check-user-exist/check-user-exist.handler';
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { CreateUserService } from './commands/create-user/create-user.service';
import { UserCreationPort } from '../user-creation.port';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { GetReadingPreferencesHandler } from './queries/get-reading-preferences/get-reading-preferences.handler';
import { GetUserProfileHandler } from './queries/get-user-profile/get-user-profile.handler';
import { GetCurrentUserHandler } from '../queries/get-current-user/get-current-user.handler';
import { GetUsersHandler } from './queries/get-users/get-users.handler';
import { SearchUsersHandler } from './queries/search-users/search-users.handler';
import { ToggleBanHandler } from './commands/toggle-ban/toggle-ban.handler';
import { UpdateReadingPreferencesHandler } from './commands/update-reading-preferences/update-reading-preferences.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { UpdateUserImageHandler } from './commands/update-user-image/update-user-image.handler';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/public-api';
import { FollowsInfrastructureModule } from '@/modules/follows/infrastructure/public-api';
import { LibraryRepositoryModule } from '@/modules/library/infrastructure/public-api';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { PasswordHasherModule } from '@/core/security/password-hasher.module';
import { CaslCacheListener } from './listeners/casl-cache.listener';

@Module({
  imports: [
    CqrsModule,
    UsersRepositoryModule,
    PostsRepositoryModule,
    FollowsInfrastructureModule,
    LibraryRepositoryModule,
    MediaInfrastructureModule,
    IdGeneratorModule,
    PasswordHasherModule,
  ],
  providers: [
    CheckUserExistHandler,
    CreateUserHandler,
    { provide: UserCreationPort, useClass: CreateUserService },
    DeleteUserHandler,
    GetReadingPreferencesHandler,
    GetUserProfileHandler,
    GetCurrentUserHandler,
    GetUsersHandler,
    SearchUsersHandler,
    ToggleBanHandler,
    UpdateReadingPreferencesHandler,
    UpdateUserHandler,
    UpdateUserImageHandler,
    CaslCacheListener,
  ],
  exports: [UserCreationPort],
})
export class UsersApplicationModule {}
