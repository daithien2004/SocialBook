# Endpoint Swagger documentation

Use this reference when writing or reviewing a feature controller, request DTO, response DTO, or paginated endpoint.

## Controller

- Put `@ApiTags(...)` and `@ApiBearerAuth()` on an authenticated controller. Keep tag names aligned with the route and any `DocumentBuilder.addTag` entry.
- Give each endpoint an `@ApiOperation({ summary })` that describes its user-visible action.
- Declare the successful response explicitly: `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, or the existing `@ApiPaginatedResponse`.
- Use the existing `ApiProblemResponses` decorator for shared or endpoint-specific statuses. Class-level statuses should be common to its endpoints; add only relevant extra statuses at method level.
- Keep controller code thin: one command/query dispatch, then return the mapped response. Mapping a discriminated read result into one of two response DTOs is presentation mapping; permission decisions belong in the handler/read repository.
- `IdempotencyKey` already adds its header to Swagger. Do not duplicate the header declaration at each endpoint.
- `CheckPolicy` enforces authorization. `x-policy` can additionally describe it for clients, but it is optional and should not introduce a second independently maintained policy value.

## Request DTO

- Use a class with validation decorators and typed `toCommand(actor)` or `toQuery(actor)` mapping.
- Document query/path/body fields through the CLI plugin and explicit decorators where needed. Use explicit metadata for enums, formats, nested arrays, nullable values, examples, and constraints the plugin cannot infer.
- Avoid empty `@ApiProperty()` when the plugin already generates the same information; verify with the exported spec before removing an existing decorator.

## Response DTO

- Use a presentation response class built from an application read model.
- Map fields explicitly; do not spread a read model into a response. This prevents a newly added internal field from leaking into the API.
- Keep DTOs specific enough that OpenAPI schemas are meaningful. For a union response, register both models with `@ApiExtraModels` and use `oneOf` references.
- Do not return an entity, Prisma model, inline anonymous object, or untyped value from a controller.

## HTTP status convention

| Behavior | Status/body |
| --- | --- |
| Create resource | `201` with a resource/id response DTO |
| Read one/list | `200` with response DTO or `{ data, meta }` pagination |
| Action/update/delete with no representation | `204`, no body |

The Swagger success decorator and actual Nest behavior must agree. For non-GET actions that return no body, set `@HttpCode(HttpStatus.NO_CONTENT)` as needed.

## Current Reading Rooms example

Use `backend/src/modules/reading-rooms/presentation/http/reading-rooms.controller.ts` as the feature example. It uses offset pagination, a Problem Details error contract, and a full-room/preview union response. Do not copy its feature-specific DTO names into other modules.
