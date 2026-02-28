import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiAdminMutateResponse, ApiCreateResponse, ApiPublicResponse, ApiAuthResponse } from '@/common/decorators/api-responses.decorator';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

export const ApiCreateBook = () => applyDecorators(
  ApiOperation({ summary: 'Create a new book' }),
  ApiConsumes('multipart/form-data'),
  ApiBody({ type: CreateBookDto }),
  ApiCreateResponse(),
);

export const ApiGetBooksAdmin = () => applyDecorators(
  ApiOperation({ summary: 'Get all books (admin only)' }),
  ApiAuthResponse(),
);

export const ApiGetBooks = () => applyDecorators(
  ApiOperation({ summary: 'Get public books (browse & search)' }),
  ApiPublicResponse(),
);

export const ApiGetBookBySlug = () => applyDecorators(
  ApiOperation({ summary: 'Get book by Slug' }),
  ApiParam({ name: 'slug', description: 'Book Slug' }),
  ApiPublicResponse(),
);

export const ApiToggleLikeBook = () => applyDecorators(
  ApiOperation({ summary: 'Toggle like on a book' }),
  ApiParam({ name: 'slug', description: 'Book Slug' }),
  ApiAuthResponse(), // Using Auth response instead of single returns
  ApiResponse({ status: 404, description: 'Book not found' }) // Override specifically if needed
);

export const ApiGetBookById = () => applyDecorators(
  ApiOperation({ summary: 'Get book by ID' }),
  ApiParam({ name: 'id', description: 'Book ID' }),
  ApiPublicResponse(),
);

export const ApiUpdateBook = () => applyDecorators(
  ApiOperation({ summary: 'Update book' }),
  ApiParam({ name: 'id', description: 'Book ID' }),
  ApiConsumes('multipart/form-data'),
  ApiBody({ type: UpdateBookDto }),
  ApiAdminMutateResponse(),
);

export const ApiDeleteBook = () => applyDecorators(
  ApiOperation({ summary: 'Delete book' }),
  ApiParam({ name: 'id', description: 'Book ID' }),
  ApiAdminMutateResponse(),
);
