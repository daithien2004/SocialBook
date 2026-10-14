# OpenAPI contract review

Use this reference when auditing a module/PR or checking whether the generated OpenAPI matches runtime behavior.

## Review each endpoint

- Has the expected tag, operation summary, authentication/security, and stable operation ID?
- Does the request schema match DTO validation, including required/optional fields, ranges, enum values, path/query names, and special headers such as `Idempotency-Key`?
- Does the success status and schema match actual controller behavior? A 204 must have no response body.
- Are paginated responses documented with the same `{ data, meta }` shape and metadata kind as the runtime helper?
- Are all response classes real DTOs mapped explicitly from read models? Are unions represented with valid `$ref`s and `oneOf`?
- Are common and endpoint-specific error statuses accurate and represented as `application/problem+json` with the shared Problem Details schema?
- Do authorization metadata and runtime `@CheckPolicy` agree? Treat `x-policy` as optional metadata, not the enforcement mechanism.
- Would changing an operation ID, response field/type, required request field, or stable error code break an existing client?

## Validate

Run the backend check required by the repository. When the API is available, run:

```powershell
npm run openapi:export --workspace=backend
```

Then inspect only the affected paths in `backend/openapi.json`. The export script requires a running API; if it is unavailable, report that the artifact could not be regenerated rather than editing JSON by hand.

The repository has runtime OpenAPI contract tests and an API-response decorator test. Add or update contract tests when a change alters observable response behavior or shared Swagger generation. Do not copy sample tests that use unsafe type assertions into this strict TypeScript repo.

## Optional CI hardening

Spectral linting, `oasdiff`, a full static OpenAPI contract suite, and CI artifact-diff gates are useful system-level improvements, but are not prerequisites for documenting one endpoint. Add them only as a separate foundation task, based on the current CI and OpenAPI artifact workflow.
