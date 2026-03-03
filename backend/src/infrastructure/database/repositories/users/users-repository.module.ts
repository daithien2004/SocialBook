import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/infrastructure/database/schemas/user.schema';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    {
      provide: IUserRepository,
      useClass: UsersRepository,
    },
  ],
  exports: [
    IUserRepository,
    MongooseModule,
  ],
})
export class UsersRepositoryModule {}
