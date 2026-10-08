import { describe, expect, it, jest } from '@jest/globals';
import type { Redis } from 'ioredis';
import { UserOperationLock } from '@/modules/reading-rooms/presentation/websocket/user-operation-lock';
import { fakeOf } from '../../support/typed-fake';

describe('UserOperationLock', () => {
  it('acquires with NX/PX and releases only when the token still matches', async () => {
    const set = jest.fn(
      (
        _key: string,
        _token: string,
        _mode: 'PX',
        _ttl: number,
        _condition: 'NX',
      ) => Promise.resolve('OK'),
    );
    const evalScript = jest.fn(
      (_script: string, _keyCount: number, _key: string, _token: string) =>
        Promise.resolve(1),
    );
    const lock = new UserOperationLock(
      fakeOf<Redis>({ set, eval: evalScript }),
    );
    const operation = jest.fn(() => Promise.resolve('done'));

    await expect(lock.runExclusive('user-1', operation)).resolves.toBe('done');

    expect(set).toHaveBeenCalledWith(
      'lock:user:user-1',
      expect.any(String),
      'PX',
      15_000,
      'NX',
    );
    expect(operation).toHaveBeenCalledTimes(1);
    expect(evalScript.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining("redis.call('GET', KEYS[1]) == ARGV[1]"),
    );
  });
});
