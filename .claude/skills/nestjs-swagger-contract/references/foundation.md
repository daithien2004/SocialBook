# Swagger foundation in this repository

Read this reference when changing global Swagger setup or OpenAPI export. For a single endpoint, use `endpoint-docs.md` and leave global setup alone.

## Existing foundation

- `backend/src/core/config/swagger.config.ts` builds the OpenAPI 3.1 document and serves Swagger UI at `/docs` with JSON at `/docs/openApi.json`.
- `backend/src/main.ts` calls `configSwagger(app)` only when `NODE_ENV !== 'production'`; worker startup does not call it.
- `backend/nest-cli.json` enables the `@nestjs/swagger` CLI plugin. DTOs currently use explicit Swagger decorators as well; do not remove them unless generated metadata is verified in the exported document.
- `backend/src/shared/platform/dto/problem-details.dto.ts` is the shared error schema. The API uses `application/problem+json`.
- `backend/scripts/export-openapi.mjs` fetches the running API and writes `backend/openapi.json`. It is not an offline source compiler.

## When changing the foundation

- Preserve the existing `ProblemDetailsDto`; do not add a parallel generic `{ code, message }` error body.
- Keep docs disabled in production by default. If changing exposure behavior, validate the environment setting and protect both UI and JSON endpoints.
- Use stable, explicit bearer-auth scheme names if changing auth documentation. Check existing generated clients before changing scheme names or operation IDs.
- Add tags to `DocumentBuilder` when the project wants a curated tag list; the controller's `@ApiTags` value must match.
- Configure CLI plugin suffixes and comment/validator introspection only after checking actual DTO filenames and verifying the generated document. The plugin does not replace explicit metadata for enums, nested arrays, nullable fields, or examples.
- Export the spec with the API running, inspect the diff, and do not hand-edit `openapi.json` as a substitute for source metadata.

## Current export command

```powershell
npm run openapi:export --workspace=backend
```

The script defaults to `http://localhost:5000/docs/openApi.json`; set `OPENAPI_URL` only when the API is intentionally running elsewhere.
