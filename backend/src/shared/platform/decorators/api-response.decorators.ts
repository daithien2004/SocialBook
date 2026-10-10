import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ProblemDetailsDto } from '../dto/problem-details.dto';

export type PaginationKind = 'offset' | 'cursor';
type PrimitiveSchemaType = 'string' | 'number' | 'integer' | 'boolean';
type MetaPropertySchema = {
  type: 'integer' | 'string' | 'boolean';
  example?: number | boolean;
  nullable?: boolean;
};

export function ApiPaginatedResponse(
  model: Type<unknown> | PrimitiveSchemaType,
  kind: PaginationKind,
) {
  const offsetMetaProperties = {
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 100 },
    totalPages: { type: 'integer', example: 5 },
  } satisfies Record<string, MetaPropertySchema>;
  const cursorMetaProperties = {
    limit: { type: 'integer', example: 20 },
    nextCursor: { type: 'string', nullable: true },
    hasMore: { type: 'boolean', example: false },
  } satisfies Record<string, MetaPropertySchema>;
  const metaProperties =
    kind === 'offset' ? offsetMetaProperties : cursorMetaProperties;

  const itemSchema =
    typeof model === 'string'
      ? { type: model }
      : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ...(typeof model === 'string' ? [] : [ApiExtraModels(model)]),
    ApiResponse({
      status: 200,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: itemSchema },
          meta: {
            type: 'object',
            required: Object.keys(metaProperties),
            properties: metaProperties,
          },
        },
      },
    }),
  );
}

export function ApiProblemResponses(
  statuses: number[] = [400, 401, 403, 404, 409, 413, 422, 429, 500, 503],
) {
  return applyDecorators(
    ApiExtraModels(ProblemDetailsDto),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        ...(status === 429 || status === 503
          ? {
              headers: {
                'Retry-After': {
                  description: 'Seconds to wait before retrying the request.',
                  schema: { type: 'string', example: '5' },
                },
              },
            }
          : {}),
        content: {
          'application/problem+json': {
            schema: { $ref: getSchemaPath(ProblemDetailsDto) },
          },
        },
      }),
    ),
  );
}
