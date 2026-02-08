import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';

@Injectable()
export class GetCollectionStatsUseCase {
    private readonly logger = new Logger(GetCollectionStatsUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository
    ) {}

    async execute() {
        try {
            this.logger.log('Getting collection stats...');
            
            const stats = await this.vectorRepository.getCollectionStats();
            
            this.logger.log(`Collection stats: ${stats.totalDocuments} documents`);
            
            return stats;
        } catch (error) {
            this.logger.error('Failed to get collection stats', error);
            throw error;
        }
    }
}


