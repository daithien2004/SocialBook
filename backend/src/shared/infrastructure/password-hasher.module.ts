import { Module } from '@nestjs/common';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

@Module({
  providers: [
    {
      provide: 'IPasswordHasher',
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: ['IPasswordHasher'],
})
export class PasswordHasherModule {}
