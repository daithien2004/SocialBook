# Problem Details and endpoint errors

Use this reference when a handler or domain error changes, or when reviewing error responses in OpenAPI.

## Runtime contract

The project uses `ProblemDetailsDto` from `shared/platform/dto/problem-details.dto.ts`. `HttpExceptionFilter` returns `application/problem+json` with fields such as `type`, `title`, `status`, `code`, `detail`, `traceId`, and optional validation `errors`.

Domain errors derive from `DomainException` and carry an `ErrorCode`. `HttpExceptionFilter.statusForDomainCode()` maps codes to HTTP status. That mapping is the runtime truth; Swagger docs must match it. Do not create the skill examples' separate `ErrorResponse { code, message }`.

## Documenting errors

- `ApiProblemResponses()` is defined in `shared/platform/decorators/api-response.decorators.ts` and references the shared Problem Details schema.
- Put common statuses at controller level and add endpoint-specific statuses at method level. Avoid listing every possible status on every route.
- Derive endpoint errors by reading the handler, any domain methods it calls, repository error mapping, guards, DTO validation, and throttling.
- Include 404 when missing and unauthorized-to-read resources are intentionally indistinguishable. Include 409 only for actual conflicts; note that this project currently maps some invalid reading-room states to 400.
- Do not expose stack traces or persistence details in examples. The filter hides internal details for 5xx responses and returns a trace ID.
- Keep stable `ErrorCode` values unchanged once clients depend on them. If adding/changing an error code, inspect the filter mapping, Problem Details docs, and client impact together.

## Difference from generic error-contract templates

The original Swagger bundle used classes with static `kind`/`code` and a generic `ErrorResponse`. This repository instead has existing `DomainException` subclasses, a central `ErrorCode` union, and RFC 9457-style Problem Details. Extend the existing implementation deliberately if exact code examples are needed; do not copy the incompatible template verbatim or move Swagger dependencies into domain/application.
