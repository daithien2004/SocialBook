import { ConfigService } from '@nestjs/config';
import { GoogleIdTokenAdapter } from '@/infrastructure/auth/adapters/google-id-token.adapter';

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(function () {
    this.verifyIdToken = jest.fn();
    return this;
  }),
}));

import { OAuth2Client } from 'google-auth-library';

const MockedOAuth2Client = OAuth2Client as jest.Mock;

function createConfigService(clientId: string): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'env.GOOGLE_CLIENT_ID') return clientId;
      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

function mockClient(): {
  verifyIdToken: jest.Mock;
} {
  const instance = MockedOAuth2Client.mock.instances[0] as {
    verifyIdToken: jest.Mock;
  };
  return instance;
}

describe('GoogleIdTokenAdapter', () => {
  beforeEach(() => {
    MockedOAuth2Client.mockClear();
  });

  it('trả payload hợp lệ khi ticket hợp lệ', async () => {
    const adapter = new GoogleIdTokenAdapter(
      createConfigService('client-id.apps.googleusercontent.com'),
    );
    const client = mockClient();
    client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'google@example.com',
        sub: 'google-sub-1',
        name: 'Google User',
        picture: 'https://example.com/avatar.png',
      }),
    });

    const result = await adapter.verify('valid-id-token');

    expect(result).toEqual({
      email: 'google@example.com',
      sub: 'google-sub-1',
      name: 'Google User',
      picture: 'https://example.com/avatar.png',
    });
    expect(client.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-id-token',
      audience: 'client-id.apps.googleusercontent.com',
    });
  });

  it('trả null khi ticket không có email', async () => {
    const adapter = new GoogleIdTokenAdapter(
      createConfigService('client-id.apps.googleusercontent.com'),
    );
    const client = mockClient();
    client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-sub-1' }),
    });

    expect(await adapter.verify('valid-id-token')).toBeNull();
  });

  it('trả null khi verifyIdToken lỗi', async () => {
    const adapter = new GoogleIdTokenAdapter(
      createConfigService('client-id.apps.googleusercontent.com'),
    );
    const client = mockClient();
    client.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

    expect(await adapter.verify('bad-token')).toBeNull();
  });

  it('trả null (fail-closed) khi chưa cấu hình GOOGLE_CLIENT_ID', async () => {
    const adapter = new GoogleIdTokenAdapter(createConfigService(''));

    expect(await adapter.verify('any-token')).toBeNull();
    expect(MockedOAuth2Client).not.toHaveBeenCalled();
  });
});
