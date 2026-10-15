# Backend architecture overview

SocialBook backend is a NestJS 11 modular monolith using Node.js 24, PostgreSQL through Prisma 7, Redis, Socket.IO, BullMQ, and ChromaDB. PostgreSQL is the source of truth for relational data. Primary keys are UUID `id` values; MongoDB `_id` and `ObjectId` are not part of the application or API contract.

## Repository layout

```text
backend/src/
├── main.ts                 # HTTP API entry point
├── worker.ts               # Background worker entry point
├── app.module.ts           # Imports CoreModule and feature modules
├── core/                   # Application-wide infrastructure and configuration
├── shared/                 # Cross-feature contracts and reusable platform code
└── modules/<feature>/      # Feature-owned code and Nest module wiring
    ├── presentation/       # HTTP controllers, DTOs, Swagger
    ├── application/        # CQRS commands/queries/handlers, ports, read models
    ├── domain/             # Entities, value objects, domain errors, write repositories
    └── infrastructure/     # Prisma repositories, persistence mapping, adapters
```

There are 27 feature directories under `backend/src/modules`. They do not all have identical contents: add a layer or port only when the feature needs it. `reading-rooms` is the concrete reference feature for the target module conventions. Other features are being aligned to that standard progressively, so the directory layout alone does not imply that every old flow already follows every rule.

## Composition and processes

`AppModule` imports `CoreModule` and feature root modules. `CoreModule` groups `config`, `database`, `health`, `logging`, `queue`, `redis`, `runtime`, and `security`. Features own their controllers, CQRS handlers, persistence adapters, and queue registration.

The API starts at `main.ts` and serves `/api/v1`. The worker starts at `worker.ts`, sets worker mode before importing `AppModule`, and does not open an HTTP listener. Worker-only processors, scheduled tasks, and outbox relays are selected by process mode. Socket.IO uses Redis publisher/subscriber clients for cross-instance events.

## Dependency direction

```text
presentation → application → domain
infrastructure → application ports / domain contracts
```

Domain code does not import NestJS, Prisma, or presentation code. Application handlers depend on ports, not Prisma repositories. A feature imports another feature through that feature's `index.ts` public API. `backend/scripts/check-module-boundaries.mjs` checks public API imports, layer direction, selected core/shared rules, queue registration placement, and direct Nest module cycles.

## Command and query conventions

- Controllers validate request DTOs, construct a command/query with the authenticated `Actor`, dispatch once through `CommandBus` or `QueryBus`, and map the output to a presentation response DTO.
- Commands load and mutate a domain aggregate through its repository. Multi-record writes use the transaction convention in the `nestjs-clean-module` skill.
- Queries return application read models, not domain entities or Prisma models. Read repositories select only needed fields and enforce record-level access with CASL.
- `@CheckPolicy` and `PoliciesGuard` enforce endpoint-level action/subject policy. Record-level authorization remains in the application or read repository.
- HTTP success and error schemas are documented at the presentation boundary. Errors use the shared Problem Details contract. The `nestjs-swagger-contract` skill describes how to export and review OpenAPI.

## Persistence and API identifiers

Prisma models use PostgreSQL UUID `id` fields. Infrastructure maps Prisma records to domain aggregates for commands and to read models for queries. API DTOs expose `id`; they do not expose database-specific field names. Schema changes are maintained as Prisma migrations under `backend/prisma/migrations`.

## Where to continue reading

- Setup and commands: [`backend/README.md`](../../backend/README.md)
- Module rules: [NestJS clean module conventions](../../.claude/skills/nestjs-clean-module/references/conventions.md)
- Swagger/OpenAPI rules: [NestJS Swagger contract skill](../../.claude/skills/nestjs-swagger-contract/SKILL.md)
- Reference feature: [`backend/src/modules/reading-rooms`](../../backend/src/modules/reading-rooms)
