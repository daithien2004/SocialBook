import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';
import { PostsModule } from '../posts/posts.module';
import { FollowsModule } from '../follows/follows.module';
import { LibraryModule } from '../library/library.module';

@Module({
  imports: [
    CloudinaryModule,
    PostsModule,
    FollowsModule,
    LibraryModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),

  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule { }
