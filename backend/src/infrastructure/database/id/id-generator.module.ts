import { Module } from '@nestjs/common';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { MongoIdGenerator } from './mongo-id-generator';

@Module({
    providers: [
        {
            provide: IIdGenerator,
            useClass: MongoIdGenerator,
        },
    ],
    exports: [IIdGenerator],
})
export class IdGeneratorModule {}
