---
name: react-testing
description: React testing patterns with Jest and Testing Library, component testing, hook testing, and mocking strategies. Triggers on tasks involving writing tests, unit tests, or integration tests for React components.
---

# React Testing Best Practices

## Overview

Guidelines for writing effective unit and integration tests for React components and hooks using Jest and Testing Library.

## Trigger

Activate when:
- Writing React component tests
- Testing custom hooks
- Setting up test coverage
- Writing integration tests
- Testing async operations
- Testing user interactions

## Setup

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
```

### Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

## Testing Components

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing States

```typescript
describe('Button states', () => {
  it('shows loading state', () => {
    render(<Button loading>Saving</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

### Testing Form Components

```typescript
describe('LoginForm', () => {
  it('validates empty email', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('submits with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

## Testing Hooks

### Custom Hook Test

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
  });
});
```

### Async Hook Test

```typescript
describe('useUsers', () => {
  it('fetches users on mount', async () => {
    const { result } = renderHook(() => useUsers());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.users).toHaveLength(10);
    });
  });

  it('handles error', async () => {
    vi.spyOn(api, 'getUsers').mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useUsers());
    
    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });
  });
});
```

## Mocking

### Mock Modules

```typescript
vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));
```

### Mock Components

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));
```

### Mock Functions

```typescript
const mockLogin = vi.fn();
vi.mocked(authService.login).mockResolvedValue({ user: mockUser });

// Or inline
render(<LoginForm onLogin={vi.fn()} />);
```

## Testing Context

```typescript
describe('with AuthProvider', () => {
  it('provides user context', () => {
    const TestComponent = () => {
      const { user } = useAuth();
      return <div>{user?.name}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Best Practices

### DO

```typescript
// ✅ Test behavior, not implementation
it('shows error message when login fails', async () => {
  vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));
  
  render(<LoginForm />);
  // ... perform login
  expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
});
```

### DON'T

```typescript
// ❌ Test implementation details
it('calls setUser when logged in', () => {
  const setUser = vi.fn();
  render(<LoginForm setUser={setUser} />);
  // ...
  expect(setUser).toHaveBeenCalled(); // Too coupled to implementation
});
```

## Query Priority

Use Testing Library queries in this order:

1. `getByRole` - Most accessible
2. `getByLabelText` - Forms
3. `getByPlaceholderText` - If label not available
4. `getByText` - Visible text
5. `getByTestId` - Last resort

## Async Testing

```typescript
// Using waitFor
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Using findBy
const element = await screen.findByText('Loaded');

// Using fake timers
vi.useFakeTimers();
act(() => {
  vi.advanceTimersByTime(1000);
});
```

## Coverage Goals

| Type | Target |
|------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

## Test File Naming

```
Button.test.tsx
useAuth.test.ts
AuthContext.test.tsx
api/users.test.ts
```
