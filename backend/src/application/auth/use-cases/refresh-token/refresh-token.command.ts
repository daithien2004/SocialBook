export class RefreshTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {}
}
