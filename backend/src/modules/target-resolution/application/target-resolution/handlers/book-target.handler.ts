import { Injectable } from '@nestjs/common';
import {
  ITargetTypeHandler,
  TargetResolution,
} from '../interfaces/target-type-handler.interface';

@Injectable()
export class BookTargetHandler implements ITargetTypeHandler {
  type(): string {
    return 'book';
  }

  resolve(targetId: string): Promise<TargetResolution> {
    return Promise.resolve(new TargetResolution(undefined, targetId));
  }
}
