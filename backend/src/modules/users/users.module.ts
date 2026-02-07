import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsModule } from '../follows/follows.module';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';
import { LibraryModule } from '../library/library.module';
import { PostsModule } from '../posts/posts.module';

import { UsersController } from './presentation/users.controller';

import { User, UserSchema } from './infrastructure/schemas/user.schema';
import { UsersRepository } from './infrastructure/repositories/users.repository';
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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => FollowsModule),
    CloudinaryModule,
    PostsModule,
    LibraryModule,
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: IUserRepository,
      useClass: UsersRepository,
    },
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
    IUserRepository,
    CreateUserUseCase,
  ],
})
export class UsersModule { }
