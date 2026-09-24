import { Socket } from 'socket.io';
import { accessTokenFromSocket } from '@/presentation/gateways/socket-token.util';

function makeSocket(partial: Partial<Socket['handshake']>): Socket {
  return {
    id: 'socket-1',
    handshake: {
      auth: {},
      query: {},
      headers: {},
      ...partial,
    },
  } as unknown as Socket;
}

describe('accessTokenFromSocket', () => {
  it('reads token from handshake auth', () => {
    const socket = makeSocket({ auth: { token: 'auth-token' } });
    expect(accessTokenFromSocket(socket)).toBe('auth-token');
  });

  it('reads token from handshake query', () => {
    const socket = makeSocket({ query: { token: 'query-token' } });
    expect(accessTokenFromSocket(socket)).toBe('query-token');
  });

  it('prefers auth token over query token', () => {
    const socket = makeSocket({ auth: { token: 'auth-token' }, query: { token: 'query-token' } });
    expect(accessTokenFromSocket(socket)).toBe('auth-token');
  });

  it('falls back to the sb_access_token cookie', () => {
    const socket = makeSocket({
      headers: { cookie: 'theme=dark; sb_access_token=cookie-token; foo=bar' },
    });
    expect(accessTokenFromSocket(socket)).toBe('cookie-token');
  });

  it('returns undefined when no token is present', () => {
    expect(accessTokenFromSocket(makeSocket({}))).toBeUndefined();
  });

  it('returns undefined when cookie lacks the access token', () => {
    const socket = makeSocket({ headers: { cookie: 'session=abc' } });
    expect(accessTokenFromSocket(socket)).toBeUndefined();
  });
});