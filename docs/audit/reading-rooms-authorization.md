# Reading rooms authorization review

Review date: 2026-10-09. Scope: HTTP and Socket.IO entry points for `reading-rooms`, their application handlers, and repository predicates. This is a static code review; no live authorization probes were run.

## Authentication boundary

- The reading-room HTTP controller has no `@Public()` route. The global `JwtAuthGuard` requires an authenticated principal; controller actions derive `userId` through `@CurrentUser('id')`.
- The `/reading-rooms` Socket.IO namespace authenticates the one-time ticket in `afterInit()` before connection. The authenticated identity is copied to `socket.data`; the auth service also reserves a per-user connection slot.
- Room mutations that require an existing membership use `WsRoomGuard`. It now reads the event payload as `unknown`, validates that `roomId` is a string, then compares it with both `socket.data.roomId` and the Socket.IO room membership.

## HTTP access matrix

| Route | Identity/resource check | Result for a non-member |
| --- | --- | --- |
| `POST /api/v1/reading-rooms` | Host identity comes from JWT; handler loads the book and first chapter. | Not applicable; caller becomes host. |
| `GET /api/v1/reading-rooms/my-active` | Query uses JWT user ID in the repository member predicate. | Returns only caller's active rooms. |
| `GET /api/v1/reading-rooms/my-history` | Query uses JWT user ID in the repository history predicate. | Returns only rooms the caller joined. |
| `PATCH /api/v1/reading-rooms/:code/reactivate` | Domain entity requires the caller to be the former host. | `FORBIDDEN`. |
| `GET /api/v1/reading-rooms/:code/highlights` | Repository aggregation matches both room ID and active membership. | No match; handler returns not found. |
| `GET /api/v1/reading-rooms/:code` | Query derives membership from JWT user ID. | Returns a limited preview with `isMember: false`; omits members and highlights. |

The room preview is an intentional authenticated discovery surface according to its response shape, but that product decision should be confirmed: possession of a room code lets any authenticated user see the book ID, room mode/status, chapter slug, capacity, and member count. The route is throttled at 20 requests per minute per throttler key. Generated room codes are eight characters from a 31-symbol alphabet; accepted IDs are 6–10 alphanumeric characters.

## Socket event access matrix

| Event | Checks | Notes |
| --- | --- | --- |
| `join_room` | Authenticated socket; command loads the room, applies active/ended rules, and adds the user as member. | No room guard by design because the socket is not yet in the room. |
| `leave_room` | `WsRoomGuard`; command uses authenticated user ID. | Host transfer is checked by the domain entity. Non-member command calls are no-ops, while the guard requires the socket to be in the room. |
| `heartbeat` | `WsRoomGuard`, per-event throttle, then presence and progress update. | Payload room must equal both socket state and actual Socket.IO room. |
| `add_highlight` | `WsRoomGuard`; application handler checks active membership and room status. | Rate limited per user. |
| `remove_highlight` | `WsRoomGuard`; entity checks highlight ownership. | Ownership denial now maps to `FORBIDDEN` (403), rather than `BAD_REQUEST` (400). |
| `generate_highlight_insight` | `WsRoomGuard`; handler checks active membership and room status; Redis lock deduplicates concurrent generation. | Rate limited per user. |

## Audit notes

- No route-level authorization gap was found in the reviewed HTTP/WS operations.
- `GET /:code` preview is the main policy decision to confirm; it is not a data leak through accidental full-entity serialization, but it intentionally exposes the listed summary fields to authenticated non-members.
- Room membership is checked in more than one place for some writes: the WebSocket guard protects the transport boundary and the application handler/entity protects the use case boundary. Keep the application/domain check even if presentation guards change.
- Automated tests cover owner-only highlight deletion and the WS guard's runtime payload narrowing. Module-level authorization and socket handshake behavior still lack a focused integration test.
