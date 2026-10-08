import { QueryBus } from '@nestjs/cqrs';
import { paginated } from '@/shared/platform/dto/paginated.dto';

import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { GetPersonalizedRecommendationsQuery } from '@/modules/recommendations/application/queries/get-personalized-recommendations/get-personalized-recommendations.query';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiOkResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('personalized')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['data', 'meta', 'analysis'],
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'bookId',
              'title',
              'reason',
              'matchScore',
              'slug',
              'book',
            ],
            properties: {
              bookId: { type: 'string' },
              title: { type: 'string' },
              reason: { type: 'string' },
              matchScore: { type: 'number' },
              slug: { type: 'string' },
              book: {
                type: 'object',
                required: [
                  '_id',
                  'title',
                  'slug',
                  'views',
                  'likes',
                  'status',
                  'isDeleted',
                ],
                properties: {
                  _id: { type: 'string' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  coverUrl: { type: 'string' },
                  views: { type: 'integer' },
                  likes: { type: 'integer' },
                  status: { type: 'string' },
                  isDeleted: { type: 'boolean' },
                  genres: { type: 'array', items: { type: 'object' } },
                  authorId: { type: 'object' },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          required: ['page', 'pageSize', 'total', 'totalPages'],
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        analysis: {
          type: 'object',
          required: [
            'favoriteGenres',
            'readingPace',
            'preferredLength',
            'themes',
          ],
          properties: {
            favoriteGenres: { type: 'array', items: { type: 'string' } },
            readingPace: { type: 'string', enum: ['fast', 'medium', 'slow'] },
            preferredLength: {
              type: 'string',
              enum: ['short', 'medium', 'long'],
            },
            themes: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async getPersonalizedRecommendations(
    @Req() req: Request,
    @Query() filter: GetRecommendationsDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const query = new GetPersonalizedRecommendationsQuery(
      userId,
      filter.actualPage,
      filter.actualLimit,
    );
    const result = await this.queryBus.execute(query);

    return {
      ...paginated(result.recommendations, result.meta),
      analysis: result.analysis,
    };
  }
}
