---
name: casl-authorization
description: CASL ability-based authorization for the shared `@socialbook/shared` package. Covers `defineRulesFor`, `AppAbility`, subject ownership with field conditions, role-based rules (user/writer/admin), and integration with NestJS guards and React components. Triggers on tasks involving CASL, authorization, abilities, permission rules, role-based access, or ownership checks.
---

# CASL Authorization

## Overview

This project uses **CASL** (`@casl/ability`) for authorization, with ability rules defined in the **shared package** (`@socialbook/shared`). Both backend (NestJS guards) and frontend (conditional rendering) consume the same `AppAbility` type.

## Trigger

Activate when working on:
- CASL ability definitions (`shared/src/ability/`)
- Permission rules (`defineRulesFor`, `canAccess`)
- Ownership checks (update/delete own content)
- Role-based access control (`user`, `writer`, `admin`)
- NestJS guards that enforce abilities
- Frontend conditional rendering based on permissions
- Adding/removing subject types in the ability system

## Directory

```
shared/src/ability/
├── define-ability.ts       # defineRulesFor(), canAccess(), types
├── define-ability.spec.ts  # Tests
├── actions.ts              # AppAction type (string union)
└── subjects.ts             # AppSubject type (string union)
```

## Types & Configuration

### Actions & Subjects

```typescript
// shared/src/ability/actions.ts
export type AppAction = 'manage' | 'create' | 'read' | 'update' | 'delete';
// 'manage' is CASL's wildcard — matches every action.

// shared/src/ability/subjects.ts
export type AppSubject = 'all'
  | 'Post' | 'Comment' | 'Review' | 'UserHighlight'
  | 'RoomComment' | 'RoomQuote' | 'RoomReaction' | 'Collection';
// 'all' is CASL's wildcard — matches every subject.
```

### Ownership Shape Interfaces

Each owned subject defines a minimal shape interface with a `userId` field for ownership matching:

```typescript
// shared/src/ability/define-ability.ts
export interface PostSubject { userId: string }
export interface CommentSubject { userId: string }
export interface ReviewSubject { userId: string }
export interface UserHighlightSubject { userId: string }
export interface RoomCommentSubject { userId: string }
export interface RoomQuoteSubject { userId: string }
export interface RoomReactionSubject { userId: string }
export interface CollectionSubject { userId: string }
```

### Ability Type Composition

```typescript
import { AbilityBuilder, createMongoAbility, type CreateAbility } from '@casl/ability';
import type { MongoAbility, InferSubjects, ForcedSubject } from '@casl/ability';

export type AppAbilitySubjects =
  | AppSubject
  | InferSubjects<
      | Record<'Post', PostSubject>
      | Record<'Comment', CommentSubject>
      | Record<'Review', ReviewSubject>
      | Record<'UserHighlight', UserHighlightSubject>
      | Record<'RoomComment', RoomCommentSubject>
      | Record<'RoomQuote', RoomQuoteSubject>
      | Record<'RoomReaction', RoomReactionSubject>
      | Record<'Collection', CollectionSubject>
    >
  // ForcedSubject ensures TS doesn't widen the string literal type
  | (PostSubject & ForcedSubject<'Post'>)
  | (CommentSubject & ForcedSubject<'Comment'>)
  // ... repeat for each owned subject

export type AppAbility = MongoAbility<[AppAction, AppAbilitySubjects]>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;
```

## Defining Roles: `defineRulesFor`

```typescript
export type PrincipalRole = 'user' | 'writer' | 'admin';

export function defineRulesFor(
  role: PrincipalRole | string,
  currentUserId?: string,
): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createAppAbility);
  const { can } = builder;

  if (role === 'admin') {
    can('manage', 'all');                  // Admins can do everything
  } else {
    if (currentUserId) {
      // Ownership-based rules — user can modify their own content
      can('update', 'Post', { userId: currentUserId });
      can('delete', 'Post', { userId: currentUserId });
      can('update', 'Comment', { userId: currentUserId });
      can('delete', 'Comment', { userId: currentUserId });
      can('update', 'Review', { userId: currentUserId });
      can('delete', 'Review', { userId: currentUserId });
      can('update', 'UserHighlight', { userId: currentUserId });
      can('delete', 'UserHighlight', { userId: currentUserId });
      can('update', 'RoomComment', { userId: currentUserId });
      can('delete', 'RoomComment', { userId: currentUserId });
      can('update', 'RoomQuote', { userId: currentUserId });
      can('delete', 'RoomQuote', { userId: currentUserId });
      can('delete', 'RoomReaction', { userId: currentUserId });
      can('update', 'Collection', { userId: currentUserId });
      can('delete', 'Collection', { userId: currentUserId });
    }
    // Writer-specific rules can be added here
    // if (role === 'writer') can('create', 'Post');
  }

  return builder.build();
}
```

## Utility: `canAccess`

```typescript
export function canAccess(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
): boolean {
  return ability.can(action, subject);
}
```

## Backend: NestJS Guard Integration

### Building Ability from User

```typescript
// In a NestJS guard or interceptor:
const ability = defineRulesFor(user.role, user.id);

// Usage in controller:
if (!ability.can('update', subject)) {
  throw new ForbiddenException('You do not own this resource');
}
```

### Ownership Guard Pattern

```typescript
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ability = defineRulesFor(user.role, user.id);

    const subject = this.reflector.get<string>('subject', context.getHandler());
    const action = this.reflector.get<AppAction>('action', context.getHandler());

    // Pass the subject object with userId from the request resource
    return ability.can(action || 'update', {
      userId: request.params.userId || request.body.userId,
    });
  }
}
```

## Frontend: Conditional Rendering

```typescript
'use client';
import { defineRulesFor, canAccess } from '@socialbook/shared';

function PostActions({ post, currentUser }) {
  const ability = defineRulesFor(currentUser.role, currentUser.id);

  return (
    <>
      {canAccess(ability, 'update', post) && <EditButton post={post} />}
      {canAccess(ability, 'delete', post) && <DeleteButton post={post} />}
    </>
  );
}
```

## Key Conventions

1. **Shared package**: Ability types and `defineRulesFor` live in `shared/src/ability/` so both backend and frontend import the same `AppAbility`. Always import from `@socialbook/shared`, never duplicate the logic.
2. **Ownership via field condition**: Use `{ userId: currentUserId }` as the third argument to `can()`. CASL uses MongoDB-like query matching — the object passed to `ability.can('update', { userId: '123' })` is matched against the rule's condition.
3. **Admins**: `can('manage', 'all')` — always the first rule, short-circuits everything.
4. **No read rules**: Reads are typically authorized at the data level (query scope/filters), not via CASL. CASL is for mutation operations (create/update/delete).
5. **ForcedSubject type**: Always use `(SubjectType & ForcedSubject<'SubjectName'>)` in the subject union to prevent TS from widening the string literal. Without this, `ability.can('update', 'Post')` wouldn't type-check the subject parameter.
6. **Test all rules**: `shared/src/ability/define-ability.spec.ts` should test each role + subject combination.

## Adding a New Subject

1. Add the action string to `actions.ts` (if it's a new action type).
2. Add the subject string to `subjects.ts`.
3. Define an ownership shape interface (e.g., `interface BookmarkSubject { userId: string }`) in `define-ability.ts`.
4. Add it to `AppAbilitySubjects` union with `ForcedSubject<'SubjectName'>`.
5. Add `can('update', 'SubjectName', { userId: currentUserId })` in the appropriate role block of `defineRulesFor`.
6. Add test cases in `define-ability.spec.ts`.

## Testing

```typescript
// shared/src/ability/define-ability.spec.ts
import { defineRulesFor } from './define-ability';

describe('defineRulesFor', () => {
  it('admin can manage all', () => {
    const ability = defineRulesFor('admin', 'u1');
    expect(ability.can('manage', 'all')).toBe(true);
    expect(ability.can('delete', 'Comment', { userId: 'anyone' })).toBe(true);
  });

  it('user can delete own Post but not others', () => {
    const ability = defineRulesFor('user', 'u1');
    expect(ability.can('delete', 'Post', { userId: 'u1' })).toBe(true);
    expect(ability.can('delete', 'Post', { userId: 'u2' })).toBe(false);
  });

  it('guest (no userId) cannot mutate anything', () => {
    const ability = defineRulesFor('user', undefined);
    expect(ability.can('update', 'Post', { userId: 'u1' })).toBe(false);
  });
});
```

## Error Handling

- CASL never throws on `ability.can()` — it returns `boolean`. No try/catch needed around permission checks.
- On the backend, return `403 Forbidden` via `ForbiddenException` when `canAccess` returns `false`.
- For missing subjects (not yet defined in the ability system), `ability.can()` returns `false`, which is safe: unauthorized by default.
- Build the ability once per request/user session, reuse it for all checks in that context.