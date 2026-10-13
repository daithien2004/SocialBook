export abstract class IHighlightInsightLockPort {
  abstract tryAcquire(
    roomId: string,
    highlightId: string,
    token: string,
  ): Promise<boolean>;

  abstract release(
    roomId: string,
    highlightId: string,
    token: string,
  ): Promise<void>;
}
