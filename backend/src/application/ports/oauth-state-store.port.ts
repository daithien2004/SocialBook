import { OAuthFlowState } from '@/domain/auth/tokens/oauth-state.vo';

export abstract class OAuthStateStorePort {
  abstract create(state: string, data: OAuthFlowState): Promise<void>;
  abstract consume(state: string): Promise<OAuthFlowState | null>;
  abstract remove(state: string): Promise<void>;
}
