import { Module } from '@nestjs/common';
import { PASSWORD_HASHER_TOKEN } from '@/shared/domain/password-hasher.interface';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

@Module({
  providers: [
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [PASSWORD_HASHER_TOKEN],
})
export class PasswordHasherModule {}
