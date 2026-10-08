import { Module } from '@nestjs/common';
import { TokenRotationPort } from '../../application/auth/token-rotation.port';
import { TokenRotationAdapter } from './token-rotation.adapter';

@Module({
  providers: [
    TokenRotationAdapter,
    {
      provide: TokenRotationPort,
      useExisting: TokenRotationAdapter,
    },
  ],
  exports: [TokenRotationPort],
})
export class TokenRotationModule {}
