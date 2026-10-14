---
name: nestjs-swagger-contract
description: Document, configure, or audit Swagger/OpenAPI contracts for this NestJS backend, including endpoint DTOs, success/error responses, authentication, pagination, and exported specs.
---

# NestJS Swagger and OpenAPI contract

Use this skill when changing Swagger setup, a controller or DTO, endpoint error documentation, or the OpenAPI contract. The goal is for generated OpenAPI to describe the HTTP behavior the backend actually returns.

## Project conventions

- Swagger decorators belong in `modules/<feature>/presentation/http/` or `shared/platform/`; never add them to domain or application code.
- Controllers dispatch through `CommandBus`/`QueryBus` and return presentation response DTOs. Do not expose entities or Prisma models.
- This repository already returns RFC 9457 style `ProblemDetailsDto` bodies as `application/problem+json`. Preserve that contract; do not introduce the example `ErrorResponse` shape from other projects.
- Shared response decorators live in `shared/platform/decorators/api-response.decorators.ts`. Reuse them instead of writing another envelope or error schema.
- Swagger setup is in `core/config/swagger.config.ts`; the Nest CLI plugin is configured in `nest-cli.json`; the exported artifact is `backend/openapi.json`.

## Workflow

1. Inspect the existing endpoint, request DTO, response DTO, handler, authorization, exception mapping, and shared Swagger decorators.
2. Document the endpoint at the presentation boundary: tag/auth at controller level; operation summary, successful response, pagination shape, and endpoint-specific error statuses at method level.
3. Keep response DTOs as classes mapped explicitly from read models. Preserve existing HTTP status and response-body behavior.
4. For errors, use the project's `ProblemDetailsDto`, `ErrorCode`, `DomainException`, and `HttpExceptionFilter` conventions. Do not document errors the endpoint cannot produce.
5. Validate with backend checks. Export and inspect `backend/openapi.json` when the API is running; `npm run openapi:export --workspace=backend` fetches the running API at `localhost:5000` and cannot export from source alone.

## Read only the relevant reference

- For the one-time setup or export flow, read [foundation.md](references/foundation.md).
- For controller, DTO, response, and pagination documentation, read [endpoint-docs.md](references/endpoint-docs.md).
- For `ProblemDetails` and domain error mapping, read [problem-errors.md](references/problem-errors.md).
- For reviewing the generated spec or identifying contract drift, read [contract-review.md](references/contract-review.md).

## Decisions and limits

- `@ApiOperation`, success-response documentation, and accurate error statuses make the contract explicit. Keep decorators direct and readable; introduce a composite decorator only when it removes real repeated policy without hiding what the endpoint promises.
- `x-policy` is optional metadata for consumers that use it. Do not duplicate policy strings in a second source of truth or make `shared/casl` import Swagger; if adding the extension, keep the integration in presentation.
- `operationId`, response fields, error codes, and required request fields are client-facing contract. Treat changes to them as potentially breaking and inspect the generated diff.
- Do not add global Swagger infrastructure, new error formats, or CI tools just to document one feature. Handle those as separate, explicit contract-foundation work.
