import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GoogleOAuthStrategy } from '@/modules/auth/infrastructure/auth/services/google-oauth.strategy';
import { GitHubOAuthStrategy } from '@/modules/auth/infrastructure/auth/services/github-oauth.strategy';
import { ElevenLabsAdapter } from '@/modules/text-to-speech/infrastructure/adapters/elevenlabs.adapter';
import { IMediaPort } from '@/modules/media/domain/public-api';

describe('outbound request timeouts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets a timeout signal for Google OAuth token exchange', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network unavailable'));
    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleOAuthStrategy,
        { provide: ConfigService, useValue: { get: () => 'configured' } },
      ],
    }).compile();

    await expect(
      moduleRef.get(GoogleOAuthStrategy).exchangeCode({
        code: 'code',
        codeVerifier: 'verifier',
        redirectUri: 'https://example.test/callback',
      }),
    ).rejects.toThrow('network unavailable');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await moduleRef.close();
  });

  it('sets timeout signals for GitHub token and profile requests', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockRejectedValueOnce(new Error('profile unavailable'))
      .mockRejectedValueOnce(new Error('email unavailable'));
    const moduleRef = await Test.createTestingModule({
      providers: [
        GitHubOAuthStrategy,
        { provide: ConfigService, useValue: { get: () => 'configured' } },
      ],
    }).compile();

    await expect(
      moduleRef.get(GitHubOAuthStrategy).exchangeCode({
        code: 'code',
        codeVerifier: 'verifier',
        redirectUri: 'https://example.test/callback',
      }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, request] of fetchMock.mock.calls) {
      expect(request).toEqual(
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    }

    await moduleRef.close();
  });

  it('sets a timeout signal for ElevenLabs generation', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network unavailable'));
    const moduleRef = await Test.createTestingModule({
      providers: [
        ElevenLabsAdapter,
        { provide: ConfigService, useValue: { get: () => 'configured' } },
        { provide: IMediaPort, useValue: { uploadAudio: jest.fn() } },
      ],
    }).compile();

    await expect(
      moduleRef.get(ElevenLabsAdapter).generateAudio('text', {
        voice: 'voice',
        language: 'vi',
      }),
    ).rejects.toThrow('network unavailable');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('api.elevenlabs.io/v1/text-to-speech/'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await moduleRef.close();
  });
});
