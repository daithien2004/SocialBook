# Mechanisms reference

Read the section you need. Contents:

1. Unique constraints
2. Atomic conditional updates
3. Optimistic locking (version / ETag)
4. Pessimistic locking (row locks)
5. Distributed locks
6. Idempotency keys (API)
7. Idempotent consumers (inbox / dedup)
8. Out-of-order event handling
9. Transactional outbox
10. Saga and compensation
11. External calls with unknown outcome
12. Isolation levels in brief
13. Deadlock avoidance
14. Test recipes

---

## 1. Unique constraints

**Use when**: "at most one X per Y" (coupon per user, active subscription per user, payment per order, message id processed once).

**Why first choice**: enforced by the DB regardless of which code path or service writes; no race window; cheap.

**How**:
- Unique index on the natural key, e.g. `(user_id, coupon_id)`.
- Partial/filtered unique index for conditional uniqueness, e.g. `UNIQUE (user_id) WHERE status = 'ACTIVE'`.
- Exclusion constraints (Postgres) for overlapping ranges, e.g. room bookings with time ranges.

**Pitfalls**:
- Handle the violation as a business outcome ("already done"), not a 500. For idempotent flows, fetch and return the existing result.
- Soft-deleted rows can block or bypass uniqueness; include the status in a partial index when needed.
- NULLs are usually distinct in unique indexes; do not rely on uniqueness over nullable columns.

## 2. Atomic conditional updates

**Use when**: a bounded value is decremented/incremented, or a state transition must happen only from an expected state.

```sql
-- stock
UPDATE inventory SET qty = qty - :q WHERE sku = :sku AND qty >= :q;
-- state machine
UPDATE orders SET status = 'PAID' WHERE id = :id AND status = 'PENDING';
```
Check the affected row count. Zero rows means the condition failed (insufficient stock, or already transitioned).

**Pitfalls**:
- Do not read the value first and compute in app code; that reintroduces the race.
- With an ORM, avoid load-modify-save; use update expressions (`F()` in Django, `UpdateBuilder`/native query elsewhere).
- Works across multiple instances without any lock, which is the point.
- Hot rows still serialize at the DB; if a single row takes thousands of writes/sec, consider sharded counters or reservation tokens.

## 3. Optimistic locking (version / ETag)

**Use when**: records are read, edited over a longer time (user forms, multi-step flows), and conflicts are rare.

```sql
UPDATE doc SET body = :b, version = version + 1 WHERE id = :id AND version = :v;
```
Zero rows means someone else changed it. Decide the policy: reject with 409 and ask the user to reload, auto-merge, or retry the whole operation from a fresh read.

**Pitfalls**:
- The version must be in the `WHERE` of every write path, and bumped on every write path (batch jobs and admin tools included).
- Retrying only the update with the new version defeats the purpose; retry from the read.
- Not suitable when conflicts are frequent: retry storms waste work.
- For HTTP APIs, expose as ETag / `If-Match`.

## 4. Pessimistic locking (row locks)

**Use when**: conflicts are frequent, or the logic inside the critical section is too complex for one statement, or you must read several rows and decide before writing.

```sql
BEGIN;
SELECT * FROM wallet WHERE id = :id FOR UPDATE;
-- decide, then write
COMMIT;
```
Variants: `FOR UPDATE NOWAIT`, `SKIP LOCKED` (work queues), `FOR SHARE`.

**Pitfalls**:
- Keep the transaction short. Never call remote services while holding the lock.
- Lock rows in a consistent order across code paths to avoid deadlocks.
- Locking existing rows does not prevent inserts of new rows (phantoms). Lock a parent row, use a constraint, or use serializable isolation.
- Set lock timeouts.
- Make sure every writer of the data takes the lock, not only the one under review.

## 5. Distributed locks (Redis, ZooKeeper, etc.)

**Use when**: you need mutual exclusion over something that is not a single DB row (e.g. a job that must run on one instance, coordination across stores), and the consequence of rare violation is tolerable or independently guarded.

**Key facts**:
- Leases expire; a paused process (GC, network stall) can keep acting after losing the lock.
- For correctness-critical work, use a **fencing token** (monotonic number) checked by the resource being protected, or enforce the invariant in the DB and use the lock only as an optimization to reduce contention.
- Redis single-instance locks are not a correctness guarantee under failover.
- Always set a TTL and release only if you still own the lock (compare token).

**Heuristic**: if you are reaching for a distributed lock to protect DB data, first ask whether a constraint, conditional update, or row lock can do it. Usually yes.

## 6. Idempotency keys (API level)

**Use when**: a client can retry a write with non-idempotent effect (create order, charge, send, transfer).

**Design**:
1. Client generates a unique key per logical operation (UUID) and reuses the **same key on every retry** of that operation.
2. Server claims the key atomically: `INSERT INTO idempotency (key, user_id, request_hash, status) ...` with a unique constraint on `(user_id, key)`, in the **same transaction** as the business write when possible.
3. On first claim: execute, store the response (status code and body).
4. On duplicate: if finished, replay the stored response; if still in progress, return 409/425 or wait briefly; if the request hash differs, reject (key reuse with different payload).
5. Expire keys after a sensible window (e.g. 24h to 7 days).

**Pitfalls**:
- Key generated server-side per request, or regenerated by the client on retry: no protection.
- Key claimed after the side effect: a crash leaves the effect done with no record.
- Scope the key per user/tenant and per endpoint to avoid cross-collisions.
- Idempotency of the API does not make downstream calls idempotent; pass derived keys downstream.
- Alternative: redesign for natural idempotency (`PUT /orders/{id}/status = PAID`, client-supplied resource id on create).

## 7. Idempotent consumers (inbox / dedup)

**Assume at-least-once delivery.**

Options:
- **Naturally idempotent handler**: set-style writes, upserts keyed by business id.
- **Inbox table**: `processed_messages(message_id PRIMARY KEY)`. In one transaction: insert message id (fail on duplicate means skip), apply business change, commit.
- **Business-level dedup**: unique constraint on the business effect (e.g. one payment per order id).

**Pitfalls**:
- Dedup check in a separate transaction from the business write: crash between them gives a lost or duplicate effect.
- Non-deterministic message ids (new id on republish) defeat dedup; use a stable event id from the source.
- Side effects outside the DB (email, HTTP) are not covered by the inbox; make them idempotent via downstream keys or record-then-send with retry state.
- Poison messages: cap retries, route to a dead-letter queue, alert.

## 8. Out-of-order event handling

**Use when**: events about the same entity can arrive in any order (multiple partitions, retries, multiple producers).

- Carry a per-entity `version` or `sequence` in each event.
- Apply only if `event.version > stored.version`: `UPDATE ... WHERE id = :id AND version < :v`.
- Or partition by entity key so a single consumer sees events in order (does not protect against producer-side reordering or retries across restarts).
- For "delete then late update" cases, keep tombstones so late events do not resurrect the entity.

## 9. Transactional outbox

**Problem**: writing to the DB and publishing an event are two systems; doing both without coordination loses or fabricates events on crash.

**Pattern**: in the same DB transaction as the business change, insert a row in an `outbox` table. A relay (poller or CDC such as Debezium) publishes rows and marks them sent. Delivery is at-least-once, so consumers must be idempotent (section 7).

**Pitfalls**:
- Publishing inside the transaction callback before commit: event may go out for a rolled-back change.
- Publishing right after commit with no outbox: crash in between loses the event.
- Outbox relay needs ordering per aggregate if consumers depend on it, and monitoring for stuck rows.

## 10. Saga and compensation

**Use when**: a business operation spans several services/stores and no single ACID transaction is available.

- Define each step and its compensating action (reserve stock -> release stock; charge -> refund).
- Choose orchestration (a coordinator or workflow engine like Temporal) when the flow is complex, or choreography (events) when it is simple.
- Every step and every compensation must be idempotent and retryable.
- Persist saga state so a crash resumes rather than restarts blindly.
- Some steps cannot be undone (email sent). Order the steps so irreversible ones come last.
- Add a reconciliation job to detect stuck sagas.

## 11. External calls with unknown outcome

A timeout does not mean failure.

- **Record intent before calling**: persist a `PENDING` attempt with a stable reference id.
- **Pass an idempotency key** (derived from the attempt id) to the provider if supported.
- **On timeout**: mark `UNKNOWN`, then resolve by querying provider status or via webhook, not by blindly retrying a charge.
- **Reconciliation job**: periodically resolve `PENDING/UNKNOWN` attempts against the provider's records.
- Handle provider webhooks idempotently using their event id.
- Do not hold DB locks while waiting on the call.

## 12. Isolation levels in brief

- **READ COMMITTED** (common default): each statement sees committed data; read-modify-write races and phantoms are possible. Atomic updates and constraints are needed.
- **REPEATABLE READ / snapshot**: stable snapshot per transaction; prevents non-repeatable reads but may allow write skew (two transactions read overlapping data and write disjoint rows, jointly breaking an invariant). MySQL InnoDB's REPEATABLE READ and Postgres's differ in details; check the engine.
- **SERIALIZABLE**: strongest; expect serialization failures, so wrap in a retry loop. Useful for complex invariants over sets; costly on hot data.
- Raising isolation is a blunt tool. Prefer targeted constraints and conditional updates, and use higher isolation where invariants span multiple rows you cannot lock or constrain.

## 13. Deadlock avoidance

- Acquire locks in a global consistent order (e.g. ascending id). For transfers between accounts A and B, lock `min(A,B)` first.
- Keep transactions short; touch rows in the same order across code paths.
- Use lock timeouts and treat deadlock errors as retryable (retry the whole transaction).
- Consider collapsing to one coarser lock when fine-grained ordering is impractical.

## 14. Test recipes

- **Concurrent double-submit**: fire N parallel identical requests (same idempotency key); assert exactly one effect and identical responses.
- **Concurrent competing requests**: N parallel different requests against bounded resource (stock = 5, 20 buyers); assert never oversold and exactly 5 succeed.
- **Duplicate message**: deliver the same message twice (and concurrently); assert one effect.
- **Out-of-order**: deliver v3 then v2; assert state remains v3.
- **Crash between steps**: inject a failure after step N for each N; assert the system is consistent or recoverable after restart/reconciliation.
- **Timeout on external call**: simulate a response lost after the provider committed; assert no double charge and eventual resolution.
- **Deadlock**: concurrent cross-transfers (A->B and B->A); assert both complete (or one retries successfully).
- Prefer real DB integration tests; mocks hide exactly these bugs.
