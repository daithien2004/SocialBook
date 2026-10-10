import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export class OAuthFlowState {
  constructor(
    public readonly provider: 'google' | 'github',
    public readonly codeVerifier: string,
    public readonly callbackUrl: string,
  ) {
    if (
      !callbackUrl.startsWith('/') ||
      callbackUrl.startsWith('//') ||
      callbackUrl.startsWith('/\\')
    ) {
      throw new BadRequestDomainException(
        'callbackUrl must be a same-origin relative path',
      );
    }
  }
}
