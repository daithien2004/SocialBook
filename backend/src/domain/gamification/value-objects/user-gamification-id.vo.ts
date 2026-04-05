import { Identifier } from '@/shared/domain/identifier.base';

export class UserGamificationId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): UserGamificationId {
    return new UserGamificationId(
      Identifier.validate(id, 'User Gamification ID'),
    );
  }
}
