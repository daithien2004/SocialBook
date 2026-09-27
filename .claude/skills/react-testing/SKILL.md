---
name: react-testing
description: React/Next.js testing conventions for this project. Covers the next/jest setup, *.spec.ts(x) files in __tests__/ folders, jest.setup.ts mocks (matchMedia, t3-env SKIP_ENV_VALIDATION), Testing Library patterns, hook testing with renderHook, mocking the NestJS API client, and coverage thresholds. Triggers on tasks involving frontend tests, Jest, Testing Library, component tests, or hook tests.
---

# React Testing

## Overview

Frontend tests use **Jest via `next/jest`** with **React Testing Library**. Test files live in `__tests__/` folders and use the **`.spec.ts` / `.spec.tsx`** suffix (not `.test.*`).

## Trigger

Activate when working on:
- Component or hook tests (`*.spec.tsx`, `*.spec.ts`)
- Jest configuration or setup
- Mocking the NestJS API client
- Coverage thresholds
- Testing async flows, forms, or Radix/shadcn components

## File Conventions

```
frontend/src/
├── context/__tests__/SocketProvider.spec.tsx
├── features/auth/hooks/__tests__/useLoginFlow.spec.ts
├── features/auth/api/__tests__/auth.api.spec.ts
└── lib/__tests__/utils.spec.ts
```

- Tests sit in a **`__tests__/` folder next to the code** they test.
- Suffix is **`.spec.ts(x)`** — Jest only matches this pattern.
- One spec file per unit under test.

## Jest Configuration

The project uses `next/jest` — it handles SWC transform, CSS, and env automatically:

```typescript
// frontend/jest.config.ts
process.env.SKIP_ENV_VALIDATION = 'true'; // must run before config eval

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.(ts|tsx)'], // ← .spec, not .test
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  coverageThreshold: {
    global: { branches: 50, functions: 50, lines: 50, statements: 50 },
    './src/features/auth/': { branches: 60, functions: 60, lines: 60, statements: 60 },
    './src/lib/nestjs-client-api.ts': { branches: 60, functions: 60, lines: 60, statements: 60 },
  },
};

export default createJestConfig(config);
```

### Why `SKIP_ENV_VALIDATION`

`src/env.ts` uses **t3-env**, which throws on missing env vars at import time. Jest has no full `.env`, so `process.env.SKIP_ENV_VALIDATION = 'true'` is set **before** config evaluation and again in the setup file.

## Setup File

```typescript
// frontend/jest.setup.ts
import '@testing-library/jest-dom';

process.env.SKIP_ENV_VALIDATION = 'true';

// matchMedia — required by next-themes and Radix UI primitives
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
```

Add other global mocks here (e.g. `ResizeObserver`, `IntersectionObserver`) as needed for Radix components.

## Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookCard } from '../BookCard';

describe('BookCard', () => {
  it('calls onSelect with the book id when clicked', async () => {
    const onSelect = jest.fn();
    render(<BookCard book={{ id: 'b1', title: 'Clean Code' }} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /clean code/i }));

    expect(onSelect).toHaveBeenCalledWith('b1');
  });
});
```

- Query by **role/label/text** — not by class or `data-testid` unless unavoidable.
- Use `userEvent` (not `fireEvent`) — it mirrors real interaction.
- Wrap providers (React Query, Socket, Theme) in a local `renderWithProviders` helper when the component needs them.

## Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useLoginFlow } from '../useLoginFlow';

it('sets error when login fails', async () => {
  const { result } = renderHook(() => useLoginFlow(), { wrapper: Providers });

  await act(async () => {
    await result.current.submit({ email: 'a@b.com', password: 'x' });
  });

  await waitFor(() => expect(result.current.error).toBeTruthy());
});
```

For hooks using React Query, wrap in a fresh `QueryClientProvider` per test with `retry: false`.

## Mocking the API Client

Mock the central NestJS client rather than `fetch`:

```typescript
jest.mock('@/lib/nestjs-client-api', () => ({
  nestjsClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { nestjsClient } from '@/lib/nestjs-client-api';
(nestjsClient.get as jest.Mock).mockResolvedValue({ data: mockBook });
```

Mock `socket.io-client` when testing real-time hooks — see `SocketProvider.spec.tsx` for the established pattern.

## Async Patterns

- Use `await screen.findBy*` for elements that appear after an await.
- Use `waitFor` for assertions that need to settle.
- Avoid arbitrary `setTimeout` — `waitFor` polls.
- Always `await` user events.

## Commands

```bash
cd frontend
npm run test                                  # all tests
npm run test -- path/to/file.spec.tsx         # single file
npm run test -- --watch                       # watch mode
npm run test:coverage                         # with coverage
npm run test:e2e                              # Playwright (separate)
```

## Anti-Patterns

- ❌ Naming files `.test.tsx` — Jest won't match them (`testMatch` requires `.spec`).
- ❌ Raw `jest.config.js` without `next/jest` — SWC/CSS/env won't resolve.
- ❌ Forgetting `SKIP_ENV_VALIDATION` — t3-env crashes the run.
- ❌ Missing `matchMedia` mock — Radix/next-themes components throw.
- ❌ Snapshot tests for logic — assert behavior, not markup.
- ❌ Testing implementation details (state values) over user-visible behavior.
