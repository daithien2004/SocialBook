# SocialBook Agent Guide

## Quick Reference

- Before any task, read `.agent/context/`.
- Apply the guidance in `.agent/context/CRAFTSMAN.md` across planning, implementation, testing, and review.
- Prefer repo-specific instructions in this file over generic habits.
- Keep changes scoped. Do not rewrite unrelated areas.

## Project Overview

SocialBook is a full-stack social network for book lovers.

- Frontend: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion
- Backend: NestJS 11, TypeScript, MongoDB/Mongoose, Redis, Socket.IO
- Infra: Docker Compose for Redis and ChromaDB
- API docs: Swagger on the backend

## Repository Layout

```text
.
|- backend/      NestJS API and business logic
|- frontend/     Next.js web app
|- nginx/        Reverse proxy config
|- .agent/       Local agent context and skills
`- docker-compose.yml
```

### Backend layout

The backend is organized around Clean Architecture style boundaries:

- `backend/src/domain/`: core entities, value objects, repository contracts
- `backend/src/application/`: use cases, DTOs, mappers
- `backend/src/infrastructure/`: database adapters, external services, gateways
- `backend/src/presentation/`: controllers and delivery layer
- `backend/src/shared/`: shared abstractions and cross-cutting concerns

There are also supporting folders such as `common/`, `config/`, `core/`, `dto/`, and `utils/`.

### Frontend layout

- `frontend/src/app/`: App Router routes, layouts, pages
- `frontend/src/components/`: reusable UI building blocks
- `frontend/src/features/`: feature-oriented UI and state code
- `frontend/src/store/`: Redux store and slices
- `frontend/src/lib/`, `hooks/`, `context/`, `constants/`, `types/`: shared frontend utilities

## Required Workflow

1. Read `.agent/context/` before doing anything else.
2. Inspect the affected area before changing code.
3. Prefer a small plan first, especially for non-trivial work.
4. Make the smallest change that fully solves the task.
5. Run targeted validation for the area you changed.
6. Call out assumptions, risks, and anything not verified.

## Local Skills

Use local skills when the task matches them:

- `.agent/skills/vercel-react-best-practices/`: use for Next.js, React, rendering, data flow, and performance-sensitive frontend work
- `.agent/skills/mongodb/SKILLS.md`: use whenever reviewing or changing MongoDB queries, aggregation pipelines, or index strategy

If a task touches MongoDB query performance, explicitly apply the MongoDB optimization guidance before proposing a solution.

## Setup And Run Commands

### Infrastructure

From the repo root:

```powershell
docker-compose up -d
```

### Backend

```powershell
cd backend
npm install
npm run start:dev
```

Useful backend commands:

- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run seed`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Useful frontend commands:

- `npm run build`
- `npm run lint`

## Environment Notes

### Backend `.env`

Backend expects values for keys such as:

- `PORT`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `FRONTEND_URL`
- `NODE_ENV`
- mail credentials
- Cloudinary credentials
- Google API credentials
- RapidAPI moderation settings

### Frontend `.env.local`

Frontend expects values such as:

- `NEXT_PUBLIC_NEST_API_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SOCKET_URL`

Never commit secrets or replace real environment values with placeholders unless the task is explicitly about docs/templates.

## Change Guidelines

### Backend

- Preserve architectural boundaries. Avoid coupling controllers directly to infrastructure details.
- Put business rules in `domain/` or `application/`, not controllers.
- Favor explicit DTOs and mappers over leaking persistence models across layers.
- Reuse existing modules and patterns before introducing new abstractions.
- Add or update tests when behavior changes.

### Frontend

- Preserve existing design language unless the task is a redesign.
- Prefer feature-local changes when possible.
- Keep client/server component boundaries intentional.
- Follow existing state management patterns before introducing new ones.
- Validate both loading and error states for user-facing flows.

### MongoDB

- Use indexes intentionally.
- Check query shape before changing schemas or adding complexity.
- Favor `$match` early in aggregation pipelines.
- Avoid unnecessary full-document fetches when projection is enough.
- If performance is the issue, propose `explain("executionStats")` verification and index updates based on ESR ordering.

## Testing Expectations

- Run the smallest meaningful test set for the change.
- For backend logic changes, prefer targeted Jest coverage first, then broader validation if needed.
- For frontend changes, at minimum run lint/build checks relevant to the edited area when practical.
- If you cannot run verification, state exactly why.

## Review Checklist

Before finishing, verify:

- The change matches the user request
- No unrelated files were modified intentionally
- Imports, types, and paths are correct
- New behavior is covered by validation or clearly marked as unverified
- Architectural boundaries remain clean
- Sensitive values were not exposed

## Communication Rules For Agents

- Be concise, specific, and repo-aware.
- Mention file paths and commands explicitly when they matter.
- Surface tradeoffs early if a change could affect architecture, data shape, or API contracts.
- If instructions conflict, follow direct user instructions first, then this file, then general preferences.
