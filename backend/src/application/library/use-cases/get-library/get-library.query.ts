import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';

export class GetLibraryQuery {
    constructor(
        public readonly userId: string,
        public readonly status?: ReadingStatus
    ) { }
}
