import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/features/auth/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './src/lib/nestjs-client-api.ts': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default createJestConfig(config);
