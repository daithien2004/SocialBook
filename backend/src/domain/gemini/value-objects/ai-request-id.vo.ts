import { Identifier } from '@/shared/domain/identifier.base';

export class AiRequestId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): AiRequestId {
        return new AiRequestId(Identifier.validate(id, 'AI Request ID'));
    }
}
