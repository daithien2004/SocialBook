import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class MongoIdGenerator implements IIdGenerator {
    generate(): string {
        return new Types.ObjectId().toString();
    }
}
