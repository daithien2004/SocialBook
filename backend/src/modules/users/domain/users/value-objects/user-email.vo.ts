import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export class UserEmail {
  private readonly _value: string;

  private constructor(email: string) {
    this._value = email;
  }

  static create(email: string): UserEmail {
    if (!email || email.trim().length === 0) {
      throw new BadRequestDomainException('Email cannot be empty');
    }

    const trimmed = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new BadRequestDomainException('Invalid email format');
    }

    return new UserEmail(trimmed);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: UserEmail): boolean {
    return this._value === other.value;
  }
}
