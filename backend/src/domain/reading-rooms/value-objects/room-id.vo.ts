import { randomBytes } from 'crypto';
import { Identifier } from '@/shared/domain/identifier.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export class RoomId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(value?: string): RoomId {
    if (value) {
      const sanitized = value.trim().toUpperCase();
      if (!this.isValid(sanitized)) {
        throw new BadRequestDomainException('Invalid room ID format. Must be 6 alphanumeric characters.');
      }
      return new RoomId(sanitized);
    }
    return new RoomId(this.generate());
  }

  static isValid(value: string): boolean {
    return /^[A-Z0-9]{6}$/i.test(value);
  }

  private static generate(): string {
    // Generate a 6-character alphanumeric string, uppercase
    return randomBytes(3).toString('hex').toUpperCase();
  }
}
