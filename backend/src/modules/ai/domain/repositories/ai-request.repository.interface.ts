import { AIRequest } from '../entities/ai-request.entity';

export abstract class IAIRequestRepository {
  abstract save(request: AIRequest): Promise<void>;
}
