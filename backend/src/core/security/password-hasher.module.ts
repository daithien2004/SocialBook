import { Module } from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

@Module({
  providers: [
    {
      provide: IPasswordHasher,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [IPasswordHasher],
})
export class PasswordHasherModule {}
