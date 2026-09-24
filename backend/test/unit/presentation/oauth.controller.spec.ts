import {
  OAuthController,
  toErrorCode,
} from '@/presentation/auth/oauth.controller';
import {
  OAuthProviderError,
  OAuthErrorCode,
} from '@/domain/auth/exceptions/oauth-exceptions';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/domain/auth/exceptions/auth-exceptions';
import { ConflictException } from '@nestjs/common';

describe('toErrorCode', () => {
  it('maps ConflictException to EmailUsedWithPassword', () => {
    expect(toErrorCode(new ConflictException('x'))).toBe(
      OAuthErrorCode.EmailUsedWithPassword,
    );
  });

  it('maps UserBannedDomainException to AccountBanned', () => {
    expect(toErrorCode(new UserBannedDomainException())).toBe(
      OAuthErrorCode.AccountBanned,
    );
  });

  it('maps UnauthorizedDomainException to EmailNotVerified', () => {
    expect(toErrorCode(new UnauthorizedDomainException())).toBe(
      OAuthErrorCode.EmailNotVerified,
    );
  });

  it('maps OAuthProviderError to OAuthFailed', () => {
    expect(toErrorCode(new OAuthProviderError('google', new Error()))).toBe(
      OAuthErrorCode.OAuthFailed,
    );
  });
});
