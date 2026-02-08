import { Module } from '@nestjs/common';
import { CheckUserExistUseCase } from './use-cases/check-user-exist/check-user-exist.use-case';
import { CreateUserUseCase } from './use-cases/create-user/create-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user/delete-user.use-case';
import { GetReadingPreferencesUseCase } from './use-cases/get-reading-preferences/get-reading-preferences.use-case';
import { GetUserByIdUseCase } from './use-cases/get-user-by-id/get-user-by-id.use-case';
import { GetUserProfileUseCase } from './use-cases/get-user-profile/get-user-profile.use-case';
import { GetUsersUseCase } from './use-cases/get-users/get-users.use-case';
import { SearchUsersUseCase } from './use-cases/search-users/search-users.use-case';
import { ToggleBanUseCase } from './use-cases/toggle-ban/toggle-ban.use-case';
import { UpdateReadingPreferencesUseCase } from './use-cases/update-reading-preferences/update-reading-preferences.use-case';
import { UpdateUserUseCase } from './use-cases/update-user/update-user.use-case';
import { UpdateUserImageUseCase } from './use-cases/update-user-image/update-user-image.use-case';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { FollowsRepositoryModule } from '@/infrastructure/database/repositories/follows/follows-repository.module';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { ExternalServicesModule } from '@/infrastructure/external/external-services.module';

@Module({
  imports: [
    UsersRepositoryModule,
    PostsRepositoryModule,
    FollowsRepositoryModule,
    LibraryRepositoryModule,
    ExternalServicesModule,
  ],
  providers: [
    CheckUserExistUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    GetReadingPreferencesUseCase,
    GetUserByIdUseCase,
    GetUserProfileUseCase,
    GetUsersUseCase,
    SearchUsersUseCase,
    ToggleBanUseCase,
    UpdateReadingPreferencesUseCase,
    UpdateUserUseCase,
    UpdateUserImageUseCase,
  ],
  exports: [
    CheckUserExistUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    GetReadingPreferencesUseCase,
    GetUserByIdUseCase,
    GetUserProfileUseCase,
    GetUsersUseCase,
    SearchUsersUseCase,
    ToggleBanUseCase,
    UpdateReadingPreferencesUseCase,
    UpdateUserUseCase,
    UpdateUserImageUseCase,
  ],
})
export class UsersApplicationModule {}
