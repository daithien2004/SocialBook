import { describe, expect, it, jest } from '@jest/globals';
import type { Redis } from 'ioredis';
import { PresenceCacheAdapter } from '@/modules/reading-rooms/infrastructure/cache/presence-cache.adapter';
import { fakeOf } from '../../../support/typed-fake';

describe('PresenceCacheAdapter', () => {
  it('sets the room members index TTL to ten minutes', async () => {
    const evalScript = jest.fn((..._args: unknown[]) => null);
    const redis = fakeOf<Redis>({ eval: evalScript });
    const adapter = new PresenceCacheAdapter(redis);

    await adapter.upsertPresence('ROOM_A', 'user-1', 'socket-1', {
      userId: 'user-1',
      displayName: 'Reader',
      avatarUrl: '',
      currentChapterSlug: 'chapter-1',
    });

    const script = evalScript.mock.calls[0]?.[0];
    expect(script).toEqual(
      expect.stringContaining("redis.call('EXPIRE', KEYS[2], ARGV[5])"),
    );
    expect(script).toEqual(
      expect.stringContaining("redis.call('EXPIRE', KEYS[3], ARGV[5])"),
    );
    expect(script).toEqual(
      expect.stringContaining(
        "redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])",
      ),
    );
    expect(evalScript.mock.calls[0]?.[2]).toBe(
      'presence:ROOM_A:user-1:socket-1',
    );
    expect(evalScript.mock.calls[0]?.[3]).toBe(
      'room:presence-sockets:ROOM_A:user-1',
    );
    expect(evalScript.mock.calls[0]?.[4]).toBe('room:presence-users:ROOM_A');
  });

  it('removes only the disconnecting socket and reports whether another socket remains', async () => {
    const evalScript = jest.fn((..._args: unknown[]) => 1);
    const redis = fakeOf<Redis>({ eval: evalScript });
    const adapter = new PresenceCacheAdapter(redis);

    await expect(
      adapter.removeSocketPresence('ROOM_A', 'user-1', 'socket-1'),
    ).resolves.toBe(true);

    expect(evalScript.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining("redis.call('SREM', KEYS[2], ARGV[1])"),
    );
    expect(evalScript.mock.calls[0]?.[2]).toBe(
      'presence:ROOM_A:user-1:socket-1',
    );
  });

  it('atomically removes every socket presence for an explicit room leave', async () => {
    const evalScript = jest.fn((..._args: unknown[]) => Promise.resolve(2));
    const redis = fakeOf<Redis>({ eval: evalScript });
    const adapter = new PresenceCacheAdapter(redis);

    await adapter.removeUserPresences('ROOM_A', 'user-1');

    expect(evalScript.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining("redis.call('DEL', ARGV[1] .. socketId)"),
    );
    expect(evalScript.mock.calls[0]?.[2]).toBe(
      'room:presence-sockets:ROOM_A:user-1',
    );
    expect(evalScript.mock.calls[0]?.[4]).toBe('presence:ROOM_A:user-1:');
  });

  it('clears per-socket entries and indexes when a room ends', async () => {
    const evalScript = jest.fn((..._args: unknown[]) => Promise.resolve(1));
    const redis = fakeOf<Redis>({ eval: evalScript });
    const adapter = new PresenceCacheAdapter(redis);

    await adapter.removeRoomPresences('ROOM_A');

    expect(evalScript.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining("redis.call('SMEMBERS', KEYS[1])"),
    );
    expect(evalScript.mock.calls[0]?.[3]).toBe('room:presence-sockets:ROOM_A:');
    expect(evalScript.mock.calls[0]?.[4]).toBe('presence:ROOM_A:');
  });
});
