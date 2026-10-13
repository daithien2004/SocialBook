import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class RandomIdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
