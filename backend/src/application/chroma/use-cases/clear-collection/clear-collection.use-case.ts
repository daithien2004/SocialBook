import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';

@Injectable()
export class ClearCollectionUseCase {
    private readonly logger = new Logger(ClearCollectionUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository
    ) {}

    async execute() {
        try {
            this.logger.log('Clearing vector collection...');
            
            await this.vectorRepository.clearCollection();
            
            this.logger.log('Vector collection cleared successfully');
            
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to clear vector collection', error);
            throw error;
        }
    }
}


