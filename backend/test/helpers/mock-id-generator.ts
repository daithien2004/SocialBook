import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export function createMockIdGenerator(
  prefix: string = 'generated-',
): jest.Mocked<IIdGenerator> {
  let counter = 0;
  const mock: jest.Mocked<IIdGenerator> = {
    generate: jest.fn(() => `${prefix}${++counter}`),
  };
  return mock;
}
