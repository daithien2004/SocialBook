import { OAuthStateService } from '@/application/auth/services/oauth-state.service';
import { OAuthStateStorePort } from '@/application/ports/oauth-state-store.port';

describe('OAuthStateService', () => {
  const store = {
    create: jest.fn(),
    consume: jest.fn().mockResolvedValue(null),
    remove: jest.fn(),
  } as unknown as OAuthStateStorePort;
  const service = new OAuthStateService(store);

  it('generates state + verifier and stores S256 challenge', async () => {
    const flow = await service.beginFlow('google', '/');
    expect(flow.state).toHaveLength(64);
    expect(flow.codeVerifier).toHaveLength(96);
    expect(flow.codeChallenge).not.toBe(flow.codeVerifier); // hashed != raw
    expect(store.create).toHaveBeenCalled();
    expect(flow.callbackUrl).toBe('/');
  });

  it('returns null for unknown state', async () => {
    expect(await service.getConsumedFlow('nope')).toBeNull();
  });
});
