import { Identifier } from '@/shared/domain/identifier.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export type RoomModeType = 'sync' | 'free' | 'discussion';

export class RoomMode extends Identifier {
  private constructor(value: RoomModeType) {
    super(value);
  }

  static create(value: string): RoomMode {
    if (!this.isValid(value)) {
      throw new BadRequestDomainException(`Invalid room mode: ${value}. Allowed: sync, free, discussion`);
    }
    return new RoomMode(value as RoomModeType);
  }

  static isValid(value: string): boolean {
    return ['sync', 'free', 'discussion'].includes(value);
  }
}
