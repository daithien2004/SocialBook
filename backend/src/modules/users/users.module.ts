import { Module } from '@nestjs/common';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';
import { LibraryModule } from '../library/library.module';
import { PostsModule } from '../posts/posts.module';
import { UsersInfrastructureModule } from './infrastructure/users.infrastructure.module';
import { FollowsInfrastructureModule } from '../follows/infrastructure/follows.infrastructure.module';

import { UsersController } from './presentation/users.controller';

import { IUserRepository } from './domain/repositories/user.repository.interface';

// Use Cases
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users/get-users.use-case';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id/get-user-by-id.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user/delete-user.use-case';
import { ToggleBanUseCase } from './application/use-cases/toggle-ban/toggle-ban.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile/get-user-profile.use-case';
import { CheckUserExistUseCase } from './application/use-cases/check-user-exist/check-user-exist.use-case';
import { UpdateUserImageUseCase } from './application/use-cases/update-user-image/update-user-image.use-case';
import { GetReadingPreferencesUseCase } from './application/use-cases/get-reading-preferences/get-reading-preferences.use-case';
import { UpdateReadingPreferencesUseCase } from './application/use-cases/update-reading-preferences/update-reading-preferences.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users/search-users.use-case';

@Module({
  imports: [
    UsersInfrastructureModule,
    FollowsInfrastructureModule,
    CloudinaryModule,
    PostsModule,
    LibraryModule,
  ],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetUsersUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ToggleBanUseCase,
    GetUserProfileUseCase,
    CheckUserExistUseCase,
    UpdateUserImageUseCase,
    GetReadingPreferencesUseCase,
    UpdateReadingPreferencesUseCase,
    SearchUsersUseCase,
  ],
  exports: [
    UsersInfrastructureModule,
    CreateUserUseCase,
  ],
})
export class UsersModule { }
