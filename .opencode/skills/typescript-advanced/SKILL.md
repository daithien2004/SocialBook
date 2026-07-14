---
name: typescript-advanced
description: Advanced TypeScript patterns, generics, utility types, type guards, and type-safe API design. Triggers on tasks involving TypeScript, complex types, or type safety improvements.
---

# TypeScript Advanced

## Overview

Advanced TypeScript patterns for building type-safe, maintainable applications.

## Trigger

Activate when:
- Writing complex generic types
- Creating utility types
- Implementing type guards
- Working with mapped types
- Building type-safe APIs
- Performance optimization with types

## Generics

### Basic Generics

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// Generic class
class DataCache<T> {
  private cache = new Map<string, T>();
  
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }
  
  get(key: string): T | undefined {
    return this.cache.get(key);
  }
}
```

### Constrained Generics

```typescript
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

### Generic Utilities

```typescript
// Key remapping
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Conditional types
type IsArray<T> = T extends any[] ? true : false;
type A = IsArray<string[]>; // true
type B = IsArray<string>;   // false

// Infer
type ReturnType<T> = T extends (...args: any) => infer R ? R : never;
type FunctionReturn = ReturnType<() => string>; // string
```

## Utility Types

### Built-in Utilities

```typescript
// Partial - all properties optional
type Partial<T> = { [P in keyof T]?: T[P] };

// Required - all properties required
type Required<T> = { [P in keyof T]-?: T[P] };

// Readonly - all properties readonly
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Pick - select properties
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

// Omit - exclude properties
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Record
type Record<K extends keyof any, V> = { [P in K]: V };
```

### Custom Utility Types

```typescript
// Nullable
type Nullable<T> = T | null;

// NonNullable
type NonNullable<T> = T extends null | undefined ? never : T;

// DeepPartial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// DeepReadonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Async return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;
```

## Type Guards

### Basic Type Guards

```typescript
// typeof
if (typeof value === 'string') {
  // value is string here
}

// instanceof
if (obj instanceof Date) {
  // obj is Date here
}
```

### Custom Type Guards

```typescript
// Simple guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Guard with predicate
interface Cat { meow(): void; }
interface Dog { bark(): void; }

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

// Assertion function
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new Error('Not a string');
  }
}
```

### Discriminated Unions

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

function handle<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

// Exhaustiveness checking
function never(x: never): never {
  throw new Error('Unexpected value');
}

function process(action: 'add' | 'remove' | 'update') {
  switch (action) {
    case 'add': return 'adding';
    case 'remove': return 'removing';
    case 'update': return 'updating';
    default: never(action);
  }
}
```

## Mapped Types

### Basic Mapped Types

```typescript
// Transform values
type Stringify<T> = {
  [K in keyof T]: string;
};

// Filter keys
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// Conditional mapped type
type MapDiscriminatedUnion<T> = {
  [K in T extends { type: infer U } ? U : never]: 
    T extends { type: K } ? T : never;
};
```

### Template Literal Types

```typescript
type EventName = 'click' | 'focus' | 'blur';
type Handler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

type APIRoute = '/users' | '/posts';
type Method = 'GET' | 'POST';
type Endpoint = `${Method} ${APIRoute}`;
// 'GET /users' | 'POST /users' | 'GET /posts' | 'POST /posts'
```

## Advanced Patterns

### Intersection Types

```typescript
type A = { a: string };
type B = { b: number };
type C = A & B; // { a: string; b: number }

// Merge with override
type Override<T, U> = Omit<T, keyof U> & U;
```

### Branded Types

```typescript
// Prevent primitive confusion
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId) { }
function getOrder(id: OrderId) { }

const userId = createUserId('123');
getUser(userId); // OK
getOrder(userId); // Error - different types
```

### Type-First Development

```typescript
// Define types first
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Then implementation
class UserService {
  async findById(id: string): Promise<User | null> {
    // implementation
  }
}
```

## Declaration Files

### Module Augmentation

```typescript
// types/extensions.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Augment existing types
declare global {
  interface String {
    capitalize(): string;
  }
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
```

### Ambient Declarations

```typescript
// globals.d.ts
declare const __DEV__: boolean;
declare const API_URL: string;
```

## Performance Tips

### Use `satisfies`

```typescript
// Type check but preserve literal types
const config = {
  endpoint: 'https://api.example.com',
  timeout: 5000,
} satisfies Config;

// config.endpoint is 'https://api.example.com' (literal)
// not just string
```

### Avoid `any`

```typescript
// BAD
function process(data: any): any { }

// GOOD
function process<T>(data: T): T { }

// Acceptable when needed
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}
```

## TypeScript Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```
