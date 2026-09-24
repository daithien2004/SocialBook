import { RedisOAuthStateAdapter } from '@/infrastructure/auth/adapters/redis-oauth-state.adapter';
import { OAuthFlowState } from '@/domain/auth/tokens/oauth-state.vo';

describe('RedisOAuthStateAdapter', () => {
  it('creates then consumes state (delete-after-read)', async () => {
    const redis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(JSON.stringify(new OAuthFlowState('google', 'v1', '/'))),
      del: jest.fn().mockResolvedValue(1),
    };
    const adapter = new RedisOAuthStateAdapter(redis as never);
    await adapter.create('s', new OAuthFlowState('google', 'v1', '/'));
    const flow = await adapter.consume('s');
    expect(flow?.codeVerifier).toBe('v1');
    expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('s'));
  });

  it('returns null when state missing', async () => {
    const redis = { get: jest.fn().mockResolvedValue(null), del: jest.fn() };
    const adapter = new RedisOAuthStateAdapter(redis as never);
    expect(await adapter.consume('missing')).toBeNull();
  });
});