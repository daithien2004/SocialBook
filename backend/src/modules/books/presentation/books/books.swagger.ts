import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookDetailResponseDto } from './dto/book-detail.response.dto';
import { BookResponseDto } from './dto/book.response.dto';
import { BookFiltersResponseDto } from './dto/book-filters.response.dto';
import { BookLikeResponseDto } from './dto/book-like.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';

export function ApiBooksController() {
  return applyDecorators(ApiTags('Books'), ApiProblemResponses([500]));
}

export function ApiCreateBook() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a book' }),
    ApiProblemResponses([400, 401, 403, 409, 413, 422, 429, 503]),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { coverUrl: { type: 'string', format: 'binary' } },
      },
    }),
    ApiCreatedResponse({ type: BookResponseDto }),
  );
}

export function ApiListAdminBooks() {
  return applyDecorators(
    ApiOperation({ summary: 'List books for administration' }),
    ApiProblemResponses([400, 401, 403, 429]),
    ApiBearerAuth(),
    ApiPaginatedResponse(BookResponseDto, 'offset'),
  );
}

export function ApiGetBookFilters() {
  return applyDecorators(
    ApiOperation({ summary: 'Get book filter options' }),
    ApiProblemResponses([429]),
    ApiOkResponse({ type: BookFiltersResponseDto }),
  );
}

export function ApiListTopReadBooks() {
  return applyDecorators(
    ApiOperation({ summary: 'List the most-read books' }),
    ApiProblemResponses([400, 429]),
    ApiPaginatedResponse(BookResponseDto, 'offset'),
  );
}

export function ApiListBooks() {
  return applyDecorators(
    ApiOperation({ summary: 'List books' }),
    ApiProblemResponses([400, 429]),
    ApiPaginatedResponse(BookResponseDto, 'offset'),
  );
}

export function ApiGetBookBySlug() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a book by slug' }),
    ApiProblemResponses([400, 404, 429]),
    ApiOkResponse({ type: BookDetailResponseDto }),
  );
}

export function ApiToggleBookLike() {
  return applyDecorators(
    ApiOperation({ summary: 'Toggle the current user’s like on a book' }),
    ApiProblemResponses([401, 403, 404, 409, 429]),
    ApiBearerAuth(),
    ApiOkResponse({ type: BookLikeResponseDto }),
  );
}

export function ApiRecordBookView() {
  return applyDecorators(
    ApiOperation({ summary: 'Record a book view' }),
    ApiProblemResponses([404, 429]),
    ApiNoContentResponse(),
  );
}

export function ApiGetBookById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a book by ID' }),
    ApiProblemResponses([400, 404, 429]),
    ApiOkResponse({ type: BookResponseDto }),
  );
}

export function ApiUpdateBook() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a book' }),
    ApiProblemResponses([400, 401, 403, 404, 409, 413, 422, 429, 503]),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { coverUrl: { type: 'string', format: 'binary' } },
      },
    }),
    ApiOkResponse({ type: BookResponseDto }),
  );
}

export function ApiDeleteBook() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a book' }),
    ApiProblemResponses([400, 401, 403, 404, 409, 429]),
    ApiBearerAuth(),
    ApiNoContentResponse(),
  );
}
