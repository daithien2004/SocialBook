/** @jest-environment node */
import { NextRequest } from 'next/server';
import { relayAuthRequest } from '@/lib/auth-proxy';

jest.mock('@/lib/server-api', () => {
  const axios = { request: jest.fn() };
  return { __esModule: true, default: axios };
});

import serverApi from '@/lib/server-api';

describe('relayAuthRequest', () => {
  beforeEach(() => {
    (serverApi.request as jest.Mock).mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards cookie header and uses maxRedirects 0 + tolerant validateStatus', async () => {
    (serverApi.request as jest.Mock).mockResolvedValue({
      status: 302,
      headers: {
        location: 'https://accounts.google.com/...',
        'set-cookie': ['a=1; Path=/', 'b=2; Path=/api/auth'],
      },
      data: '',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      headers: { cookie: 'x=y' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/google' });

    const args = (serverApi.request as jest.Mock).mock.calls[0][0];
    expect(args.method).toBe('GET');
    expect(args.maxRedirects).toBe(0);
    expect(args.validateStatus(302)).toBe(true);
    expect(args.headers.cookie).toBe('x=y');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('accounts.google.com');
    expect(res.headers.getSetCookie()).toEqual([
      'a=1; Path=/',
      'b=2; Path=/api/auth',
    ]);
  });

  it('forwards POST body as JSON', async () => {
    (serverApi.request as jest.Mock).mockResolvedValue({
      status: 200,
      headers: {},
      data: {},
    });

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: '{"email":"a@b.co"}',
      headers: { 'content-type': 'application/json', cookie: '' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/login' });

    const args = (serverApi.request as jest.Mock).mock.calls[0][0];
    expect(args.method).toBe('POST');
    expect(args.data).toBe('{"email":"a@b.co"}');
    expect(args.headers['content-type']).toBe('application/json');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({});
  });

  it('relays JSON response body so clients can parse it', async () => {
    (serverApi.request as jest.Mock).mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { data: { id: 'u1', email: 'a@b.co' } },
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { cookie: 'sb_access_token=t' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/me' });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    await expect(res.json()).resolves.toEqual({
      data: { id: 'u1', email: 'a@b.co' },
    });
  });

  it('relays plain text response bodies untouched', async () => {
    (serverApi.request as jest.Mock).mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/plain' },
      data: 'pong',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { cookie: '' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/me' });

    await expect(res.text()).resolves.toBe('pong');
  });

  it('returns 4xx statuses with body intact instead of throwing', async () => {
    (serverApi.request as jest.Mock).mockResolvedValue({
      status: 401,
      headers: {},
      data: { message: 'Unauthorized' },
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { cookie: '' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/me' });

    const args = (serverApi.request as jest.Mock).mock.calls[0][0];
    expect(args.validateStatus(401)).toBe(true);
    expect(args.validateStatus(302)).toBe(true);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ message: 'Unauthorized' });
  });

  it('returns 503 when backend is unreachable', async () => {
    (serverApi.request as jest.Mock).mockRejectedValue(
      new Error('connect ECONNREFUSED'),
    );

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { cookie: '' },
    });

    const res = await relayAuthRequest(req, { url: '/auth/me' });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toHaveProperty('message');
  });
});
