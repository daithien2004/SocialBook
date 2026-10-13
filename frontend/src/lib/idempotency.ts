import axios from 'axios';

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';

  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Idempotent request payload must use finite numbers.');
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    entries.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }

  throw new TypeError('Idempotent request payload must be JSON-compatible.');
}

export class IdempotencyRequestRunner {
  private readonly keysByPayload = new Map<string, string>();

  async execute<Payload, Result>(
    payload: Payload,
    request: (key: string) => Promise<Result>,
  ): Promise<Result> {
    const payloadKey = canonicalJson(payload);
    const idempotencyKey =
      this.keysByPayload.get(payloadKey) ?? globalThis.crypto.randomUUID();
    this.keysByPayload.set(payloadKey, idempotencyKey);

    try {
      const result = await request(idempotencyKey);
      this.keysByPayload.delete(payloadKey);
      return result;
    } catch (error: unknown) {
      if (this.isTerminalClientError(error)) {
        this.keysByPayload.delete(payloadKey);
      }
      throw error;
    }
  }

  private isTerminalClientError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;

    const status = error.response?.status;
    return (
      status !== undefined &&
      status >= 400 &&
      status < 500 &&
      status !== 408 &&
      status !== 425 &&
      status !== 429
    );
  }
}
