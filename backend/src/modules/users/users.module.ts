import { DataAccessModule } from '@/src/data-access/data-access.module';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { LibraryModule } from '../library/library.module';
import { PostsModule } from '../posts/posts.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    DataAccessModule,
    CloudinaryModule,
    PostsModule,
    LibraryModule,

  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
