import { Identifier } from '@/shared/domain/identifier.base';

export class AchievementId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): AchievementId {
        return new AchievementId(Identifier.validate(id, 'Achievement ID'));
    }
}
