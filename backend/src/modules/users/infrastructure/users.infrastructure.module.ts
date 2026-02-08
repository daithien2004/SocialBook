import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { IUserRepository } from '../domain/repositories/user.repository.interface';
import { UsersRepository } from './repositories/users.repository';


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
    ],
})
export class UsersInfrastructureModule {}
