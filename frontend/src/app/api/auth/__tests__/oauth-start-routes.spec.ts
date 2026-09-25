/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth-proxy', () => ({
  relayAuthRequest: jest.fn(),
}));

import { relayAuthRequest } from '@/lib/auth-proxy';
import { GET as googleGet, POST as googlePost } from '../google/route';
import { GET as githubGet, POST as githubPost } from '../github/route';

describe('oauth start route handlers', () => {
  beforeEach(() => {
    (relayAuthRequest as jest.Mock).mockReset();
    (relayAuthRequest as jest.Mock).mockResolvedValue(
      new Response(null, { status: 302 }),
    );
  });

  it('forwards callbackUrl query to the google backend', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/google?callbackUrl=/');

    await googleGet(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, {
      url: '/auth/google?callbackUrl=/',
    });
  });

  it('forwards callbackUrl query to the github backend', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/github?callbackUrl=/');

    await githubGet(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, {
      url: '/auth/github?callbackUrl=/',
    });
  });

  it('does not append a trailing question mark when no query is present', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/google');

    await googleGet(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, { url: '/auth/google' });
  });

  it('preserves encoded relative callback paths', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/auth/github?callbackUrl=%2Fbooks',
    );

    await githubGet(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, {
      url: '/auth/github?callbackUrl=%2Fbooks',
    });
  });

  it('forwards query on POST as well', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/auth/google?callbackUrl=/',
      { method: 'POST' },
    );

    await googlePost(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, {
      url: '/auth/google?callbackUrl=/',
    });
  });

  it('forwards query on github POST', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/auth/github?callbackUrl=/',
      { method: 'POST' },
    );

    await githubPost(req);

    expect(relayAuthRequest).toHaveBeenCalledWith(req, {
      url: '/auth/github?callbackUrl=/',
    });
  });
});
