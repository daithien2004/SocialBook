import { Identifier } from '@/shared/domain/identifier.base';

export class VectorId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): VectorId {
        return new VectorId(Identifier.validate(id, 'Vector ID'));
    }
}
