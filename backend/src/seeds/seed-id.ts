import { randomUUID } from 'node:crypto';

export function createSeedId(): string {
  return randomUUID();
}
