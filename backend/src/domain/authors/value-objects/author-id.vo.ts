import { Identifier } from '@/shared/domain/identifier.base';

export class AuthorId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): AuthorId {
        return new AuthorId(Identifier.validate(id, 'Author ID'));
    }
}
