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
      throw new Error('callbackUrl must be a same-origin relative path');
    }
  }
}
