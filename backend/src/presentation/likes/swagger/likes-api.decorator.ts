import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiPublicResponse, ApiAuthResponse } from '@/common/decorators/api-responses.decorator';

export const ApiToggleLike = () => applyDecorators(
  ApiOperation({ summary: 'Toggle like on a target (post, comment, book, chapter)' }),
  ApiAuthResponse(),
);

export const ApiGetLikeCount = () => applyDecorators(
  ApiOperation({ summary: 'Get like count for a target' }),
  ApiPublicResponse(),
);

export const ApiGetLikeStatus = () => applyDecorators(
  ApiOperation({ summary: 'Get like status for a target for the current user' }),
  ApiAuthResponse(),
);
