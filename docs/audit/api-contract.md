# API contract workflow

`backend/openapi.json` is the checked-in OpenAPI 3.1 artifact. Swagger generation sets version `3.1.0` and normalizes nullable schemas to `anyOf` with a `null` type before serving or exporting the document. When an API route, request, or response contract changes, export the running API's document and include the updated artifact and generated frontend types in the same change:

```powershell
$env:OPENAPI_URL = 'http://localhost:5000/docs/openApi.json'
npm run openapi:export --workspace=backend
npm run api:generate --workspace=frontend
```

The API must be running and expose `/docs/openApi.json`. Pull requests compare the artifact against the target branch with `oasdiff`; the CI job fails when it detects a breaking change. Additive changes such as optional response headers and documented error statuses remain allowed.

Errors use `application/problem+json`. Responses with status 429 or 503 document `Retry-After` in seconds. The HTTP exception filter preserves the throttler's `Retry-After-global`, normalizes it to `Retry-After`, and uses an exception-provided `retryAfter` when available. It supplies a 1-second fallback for 429 and a 5-second fallback for 503 when the source has no retry interval.

The response contract unit test builds a Swagger document from a test controller, validates it with `jest-openapi`, and sends requests through the actual exception filter to check the 429/503 response headers and problem content. The API contract CI job also starts the real API, exports its OpenAPI document, regenerates frontend types, and validates live liveness and paginated books responses against the committed OpenAPI artifact with `jest-openapi`. The live test is run with:

```bash
npm test --workspace=backend -- --selectProjects e2e --runInBand --runTestsByPath test/e2e/openapi-runtime-contract.e2e-spec.ts
```
