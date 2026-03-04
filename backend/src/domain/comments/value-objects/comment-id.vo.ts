import { Identifier } from '@/shared/domain/identifier.base';

export class CommentId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): CommentId {
        return new CommentId(Identifier.validate(id, 'Comment ID'));
    }
}
