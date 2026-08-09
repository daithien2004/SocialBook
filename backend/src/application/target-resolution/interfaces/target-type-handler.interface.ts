export interface TargetRedirect {
  targetType: string;
  targetId: string;
}

export class TargetResolution {
  constructor(
    public readonly actionUrl?: string,
    public readonly bookId?: string | null,
    public readonly redirect?: TargetRedirect,
  ) {}
}

export abstract class ITargetTypeHandler {
  abstract type(): string;
  abstract resolve(targetId: string): Promise<TargetResolution>;
}
