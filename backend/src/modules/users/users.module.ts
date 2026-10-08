import { Module } from '@nestjs/common';
import { UsersApplicationModule } from './application/users/users-application.module';
import { UsersController } from './presentation/users/users.controller';

@Module({
  imports: [UsersApplicationModule],
  controllers: [UsersController],
})
export class UsersModule {}
