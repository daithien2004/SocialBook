import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';

export class UpdateStatusCommand {
    constructor(
        public readonly userId: string,
        public readonly bookId: string,
        public readonly status: ReadingStatus
    ) { }
}
