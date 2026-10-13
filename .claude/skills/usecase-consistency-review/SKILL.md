---
name: usecase-consistency-review
description: Analyze a use case, handler, API endpoint, message consumer, job, or workflow for correctness under concurrency, retries, and partial failure, then decide which protections it needs (locking, optimistic versioning, atomic updates, idempotency, unique constraints, transactions, outbox, saga). Use whenever the user designs, writes, or reviews a handler that mutates shared state, touches money, inventory, quotas, coupons, balances, orders or bookings, consumes queue/event messages, or calls external services, or asks "does this need a lock", "is this idempotent", "race condition", "double submit", "oversell", "duplicate message", "what could go wrong here". Also trigger on Vietnamese phrases such as "khi nào cần lock", "check version", "idempotent", "xử lý trùng", "phân tích use case", "review handler". Use it even if concerns are not named but the code has read-modify-write on shared data, a retryable write API, or a multi-step operation across DB and other systems.
---

# Use case consistency review

Purpose: given a use case or handler (as a description, a design doc, or code), work out **what must never go wrong**, **how it could go wrong**, and **the cheapest mechanism that prevents it**. Produce a concrete, justified recommendation, not a generic lecture on concurrency.

Reply in the language the user is writing in. Keep technical terms (lock, idempotency key, outbox...) in English where that is the norm.

## Core mindset

1. **Start from invariants, not techniques.** Locks, versions and idempotency keys are tools for protecting an invariant. If you cannot name the invariant being protected, the mechanism is unjustified. If no invariant is at risk (e.g. a view counter), recommend nothing and say so.
2. **Match rigor to blast radius.** Money, stock, entitlements, access control and anything legally or financially binding get strict protection. Likes, analytics and caches get loose protection. Over-engineering is a real failure: it adds latency, deadlocks and complexity.
3. **Prefer the boring, strongest, cheapest guard.** In rough order: a DB constraint, then an atomic conditional update, then optimistic versioning, then a row lock, then a distributed lock, then a queue serialized by key. Move down the list only when the earlier option cannot express the invariant.
4. **Assume the world is hostile.** Clients retry and double-click, networks time out after the server already committed, queues deliver at-least-once and out of order, processes crash between any two statements, and two requests will eventually hit the same row at the same instant.
5. **Respect what already exists.** Before proposing new machinery, check what the codebase or platform already provides (idempotency middleware, base repository with version column, outbox library, workflow engine, `@Transactional` conventions). Reuse it; mention where the use case must opt in.

## Workflow

Work through these steps in order. Skip steps that clearly do not apply, but say that you skipped them.

### Step 1: Understand the use case

Establish, from the input or by asking (at most 2 targeted questions, only if the answer changes the recommendation):

- **Trigger**: sync API call, message consumer, scheduled job, webhook, user action in UI?
- **Reads and writes**: which entities/rows/keys are read, which are written?
- **Side effects outside the DB**: events published, emails, payment gateway calls, other services?
- **Datastore and isolation**: which DB, which isolation level, single DB or multiple services? (This changes which mechanisms are available. Default assumption if unknown: relational DB, READ COMMITTED, several app instances.)
- **Contention**: how likely is it that two operations touch the same data at once? Hot row (one inventory SKU in a flash sale) or spread out (each user edits their own profile)?

If the user pasted code, trace the actual statements in order and mark every read that influences a later write.

### Step 2: State the invariants

Write them as short, testable sentences. Typical forms:

- Non-negative / bounded: balance >= 0, stock >= 0, seats booked <= capacity
- At-most-once: one coupon redemption per user, one charge per order, one refund per payment
- Conservation: debits equal credits, total allocated equals total available
- Uniqueness: one active subscription per user, unique username
- State machine validity: an order cannot go from CANCELLED to SHIPPED, a paid order cannot be paid again
- Cross-entity consistency: order total equals sum of lines; DB record and published event agree
- Authorization freshness: a revoked permission is not honored after revocation

Then assign a **risk tier**:

- **Tier 1 (strict)**: violation loses money, oversells, breaks legal/compliance guarantees, or leaks access.
- **Tier 2 (moderate)**: violation causes user-visible wrongness that is fixable (duplicate notification, stale status).
- **Tier 3 (loose)**: violation is cosmetic or self-healing (counters, caches, analytics).

### Step 3: Run the failure checklist

For each invariant, ask the questions below. Only record a finding when the answer is "yes, this can happen here".

**A. Concurrency (two actors, same data)**
- Is there a read-modify-write (read a value, decide in app code, write back)? That is the classic lost-update / check-then-act race.
- Is there a check on something that does not yet exist (no row to lock, e.g. "if no active booking for this slot then insert")? That is a phantom / write-skew risk; row locks on existing rows will not help.
- Do two different use cases protect the same invariant (e.g. checkout and admin adjustment both change stock)? Protection must be consistent across all writers.
- Could two requests lock multiple rows in different orders (A then B vs B then A)? Deadlock risk.

**B. Retries and duplicates (same actor, same request twice)**
- Can the client, gateway, mobile SDK or a user double-click send this request more than once?
- If the response is lost after commit, will the retry produce a second effect?
- Is the effect naturally idempotent (set status = PAID) or not (increment, append, charge, send)?

**C. Messaging (queues, events, webhooks)**
- Delivery is at-least-once: can the handler run twice for the same message and break something?
- Can messages arrive out of order (update v3 before v2)? Does the handler overwrite newer state with older?
- Is there a poison-message / infinite retry loop risk?
- Do webhooks from third parties get retried and need deduplication by their event id?

**D. Partial failure (crash between steps)**
- List the steps. If the process dies after step N, what state is left? Is it recoverable and detectable?
- DB write plus event publish in separate steps: dual-write problem.
- Multi-service operation: is there a compensation or reconciliation path?

**E. External calls (timeout means unknown)**
- On timeout or 5xx from a payment/provider/other service, do we know whether it succeeded?
- Can we pass an idempotency key to the callee? Can we query status later?
- Is there a reconciliation job for stuck "pending" states?

**F. Time and state**
- Can the operation act on stale state (user viewed v5, someone else saved v6, user submits edit)? Decide: reject, merge, or last-write-wins.
- Expiry, TTL, reservation timeouts: what happens if the timer fires at the same moment as confirmation?
- Is there a state machine, and are transitions validated atomically with the write (`WHERE status = 'PENDING'`)?

### Step 4: Choose mechanisms

Map each real finding to the lightest sufficient mechanism using the table below. For details, pitfalls and snippets, read `references/mechanisms.md` when you need to recommend or review a specific mechanism.

| Finding | First choice | Escalate to |
|---|---|---|
| "Each X only once" (uniqueness, one coupon per user) | Unique constraint / unique index | Dedup table with transaction |
| Bounded counter or balance (`>= 0`, `<= capacity`) | Atomic conditional update: `UPDATE ... SET n = n - :q WHERE id = :id AND n >= :q`, check affected rows | Row lock (`SELECT ... FOR UPDATE`) if logic is too complex for one statement |
| Lost update on a record edited by humans or long flows | Optimistic version / ETag (`WHERE id = :id AND version = :v`) | Pessimistic lock if conflicts are frequent |
| Hot row with high conflict rate | Row lock, or serialize through a queue partitioned by key | Pre-sharded counters / reservation tokens |
| Existence check then insert (phantom / write-skew) | Unique or exclusion constraint | Serializable isolation, or lock on a parent row that guards the set |
| Retried write API with non-idempotent effect | Idempotency key stored with result, unique-constrained | Natural idempotency by redesign (PUT, set-state semantics) |
| At-least-once consumer | Inbox / processed-message table keyed by message id, or idempotent handler by design | Version/sequence check to drop stale events |
| Out-of-order events | Compare event version or sequence with stored version; ignore older | Per-key ordered partition |
| DB write plus publish event | Transactional outbox | CDC (e.g. Debezium) |
| Multi-service business transaction | Saga with compensations, or workflow engine (Temporal and similar) | Reconciliation job as safety net |
| External call with unknown outcome | Pass idempotency key to callee, record intent before calling, status query, reconciliation | Manual review queue |
| Multi-row locking | Lock in a consistent global order (e.g. by id ascending) | Single coarse lock if ordering is impractical |
| Cross-process mutual exclusion with no shared DB row | Distributed lock with TTL and fencing token | Rethink: usually a DB constraint or queue is safer |

Decision rules to apply:

- If one SQL statement can enforce the invariant, do that. Do not add a lock around logic that an atomic update already protects.
- Optimistic when conflicts are rare and retry is cheap; pessimistic when conflicts are frequent or the work inside the critical section is expensive to redo.
- A distributed lock (Redis etc.) alone is **not** a correctness guarantee for Tier 1: leases expire, clocks pause, processes stall. Pair it with a DB-level check or fencing token, or avoid it.
- Idempotency needs three parts: a client-stable key, atomic "claim" of that key (unique insert), and storing the result to replay. Also decide what a concurrent duplicate gets (wait, 409, or in-progress response).
- Idempotent consumers should dedupe in the **same transaction** as the business write, otherwise a crash between them reintroduces duplicates or loses work.
- Keep critical sections short: no network calls to other services while holding a DB lock.

### Step 5: Check for anti-patterns

Flag any of these if present:

- Check-then-act in application code on shared data without a constraint or lock (`if stock >= q: stock -= q; save()`).
- Idempotency key generated fresh on each retry, or scoped wrongly (not per user / per operation), or stored after the side effect instead of claimed before it.
- Catching a unique-constraint violation and treating it as a generic error instead of "already done, return the original result".
- Publishing an event or calling another service inside or right after a DB transaction with no outbox or recovery path.
- Retrying a non-idempotent call blindly.
- Locks taken in inconsistent order; locks held across remote calls; no lock timeout.
- Optimistic version column that is read but not included in the `WHERE` of the update, or version not bumped on every write path.
- Reading a balance/stock outside the transaction that later writes based on it.
- Relying on the default isolation level to "just work" without knowing what it permits.
- Protection applied on one code path while another path (admin tool, batch job, consumer) writes the same data unprotected.
- Over-protection: distributed locks or serializable transactions around Tier 3 data.

### Step 6: Produce the review

Use this structure. Keep it tight; omit sections that have nothing to say.

```
## Use case summary
<2-3 lines: trigger, data touched, side effects, contention level>

## Invariants and risk tier
- <invariant> (Tier N)

## Findings
1. <What can go wrong>  
   Scenario: <concrete interleaving or failure sequence, e.g. "T1 reads stock=1, T2 reads stock=1, both decrement, stock=-1">  
   Impact: <consequence>  
   Fix: <mechanism, and exactly where it applies>

## Recommended design
<Ordered steps of the handler with protections marked in place. Pseudocode or SQL where it helps.>

## Deliberately not needed
<Protections considered and rejected, with a one-line reason. This shows calibration and prevents over-engineering.>

## Open questions / assumptions
<Anything that would change the recommendation: isolation level, contention, who else writes this data>

## Tests to write
<Concurrent double-submit test, duplicate-message test, crash-between-steps test, etc., specific to this use case>
```

When reviewing existing code, reference lines or function names. When designing, provide the handler skeleton with protections placed. Always show at least one concrete bad interleaving for each Tier 1 finding, because a vivid failure scenario is what makes the recommendation convincing and testable.

## Calibration guidance

- A simple CRUD edit of one's own profile: usually no special mechanism, maybe an ETag if multiple devices edit. Say that plainly.
- Do not list every checklist item as a finding. Report only what is real for this use case, and list what you ruled out.
- When the information needed is missing (isolation level, who else writes, volume), state your assumption and show how the recommendation changes if it is wrong, rather than stalling on questions.
- If the platform already offers the mechanism, the recommendation is "enable/use X for this endpoint" and the verification step is "confirm the key is stable across retries / the version column is included in the update".
- Distinguish **mechanism** (how to store a key, how to check a version, which can be standardized) from **decision** (whether this use case needs it, at what granularity, what to do on conflict). Spend your analysis on the decisions.

## Worked example (compact)

Use case: `POST /orders/{id}/pay` deducts wallet balance, marks order PAID, publishes `OrderPaid`.

Invariants (Tier 1): wallet >= 0; each order charged at most once; `OrderPaid` published iff the order is PAID.

Findings:
1. Concurrent payments on the same wallet can both pass a balance check. Fix: `UPDATE wallet SET balance = balance - :amt WHERE id = :w AND balance >= :amt`; zero rows affected means insufficient funds.
2. Client retry or double-click charges twice. Fix: require `Idempotency-Key`; claim it by unique insert in the same transaction; on duplicate return the stored response. Also guard with `UPDATE orders SET status='PAID' WHERE id=:o AND status='PENDING'` so a second payment affects zero rows.
3. Crash after commit but before publishing loses `OrderPaid`. Fix: write an outbox row in the same transaction; a relay publishes it, and consumers dedupe by event id.

Deliberately not needed: distributed lock (the conditional updates already enforce both invariants in the DB), serializable isolation (no phantom/existence checks involved).
