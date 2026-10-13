import { Module } from '@nestjs/common';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { RandomIdGenerator } from './random-id-generator';

@Module({
  providers: [
    {
      provide: IIdGenerator,
      useClass: RandomIdGenerator,
    },
  ],
  exports: [IIdGenerator],
})
export class IdGeneratorModule {}
