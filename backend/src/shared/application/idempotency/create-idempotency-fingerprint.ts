import { createHash } from 'node:crypto';

// v1 omits undefined object properties, keeps null distinct, and preserves array order.
// Keep this implementation when adding a newer version so stored requests remain replayable.
function canonicalJsonV1(value: unknown): string {
  if (value === null) return 'null';

  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Fingerprint values must contain finite numbers.');
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonV1(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, item]) => item !== undefined,
    );
    entries.sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );

    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJsonV1(item)}`)
      .join(',')}}`;
  }

  throw new TypeError('Fingerprint values must be JSON-compatible.');
}

function fingerprintForVersion(
  useCase: string,
  version: number,
  payload: unknown,
): string | undefined {
  if (!useCase || !Number.isSafeInteger(version) || version < 1) return;

  let canonicalPayload: string;
  switch (version) {
    case 1:
      canonicalPayload = canonicalJsonV1(payload);
      break;
    default:
      return;
  }

  const versionLabel = String(version);
  const hash = createHash('sha256')
    .update(`${useCase}:v${versionLabel}:${canonicalPayload}`)
    .digest('hex');
  return `v${versionLabel}:${hash}`;
}

export function createIdempotencyFingerprint(
  useCase: string,
  version: number,
  payload: unknown,
): string {
  const fingerprint = fingerprintForVersion(useCase, version, payload);
  if (fingerprint === undefined) {
    throw new TypeError('Fingerprint use case or version is unsupported.');
  }
  return fingerprint;
}

export function matchesIdempotencyFingerprint(
  useCase: string,
  payload: unknown,
  fingerprint: string,
): boolean {
  const match = /^v([1-9]\d*):[a-f0-9]{64}$/.exec(fingerprint);
  const versionText = match?.[1];
  if (versionText === undefined) return false;

  const version = Number(versionText);
  if (!Number.isSafeInteger(version)) return false;

  return fingerprintForVersion(useCase, version, payload) === fingerprint;
}
