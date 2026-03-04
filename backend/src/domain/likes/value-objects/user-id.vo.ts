import { Identifier } from '@/shared/domain/identifier.base';

export class UserId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): UserId {
        return new UserId(Identifier.validate(id, 'User ID'));
    }
}
