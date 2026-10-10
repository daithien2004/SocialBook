import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Response } from 'express';
import jestOpenAPI from 'jest-openapi';
import request from 'supertest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { ProblemDetailsDto } from '@/shared/platform/dto/problem-details.dto';
import { HttpExceptionFilter } from '@/shared/platform/filters/http-exception.filter';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { normalizeOpenApi31 } from '@/config/openapi-31';

@Controller('response-contract')
@ApiProblemResponses()
class ResponseContractController {
  @Get()
  @ApiPaginatedResponse(ProblemDetailsDto, 'cursor')
  list() {
    return {
      data: [],
      meta: { limit: 20, nextCursor: null, hasMore: false },
    };
  }

  @Get('limited')
  limited(): never {
    throw new HttpException(
      { message: 'Too many requests', retryAfter: 7 },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  @Get('limited-global')
  limitedGlobal(@Res() response: Response): never {
    response.setHeader('Retry-After-global', '11');
    throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
  }

  @Get('limited-fallback')
  limitedFallback(): never {
    throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
  }

  @Get('unavailable')
  unavailable(): never {
    throw new ServiceUnavailableException('Temporarily unavailable');
  }

  @Get('domain-invalid')
  domainInvalid(): never {
    throw new BadRequestDomainException('Book title cannot be empty');
  }
}

describe('API response Swagger decorators', () => {
  it('documents cursor metadata and Problem Details error responses', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResponseContractController],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'socialbook-openapi-'),
    );

    try {
      await app.init();
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('response contract test')
          .setOpenAPIVersion('3.1.0')
          .build(),
      );
      normalizeOpenApi31(document);
      expect(document.openapi).toBe('3.1.0');
      expect(JSON.stringify(document)).not.toContain('"nullable"');
      const specPath = join(temporaryDirectory, 'openapi.json');
      await writeFile(specPath, JSON.stringify(document), 'utf8');
      jestOpenAPI(specPath);
      const operation = document.paths['/response-contract'].get;
      if (!operation) throw new Error('Swagger operation was not generated');

      expect(operation.responses['400']).toBeDefined();
      expect(operation.responses['500']).toBeDefined();
      expect(operation.responses['503']).toMatchObject({
        headers: {
          'Retry-After': {
            schema: { type: 'string', example: '5' },
          },
        },
      });
      expect(operation.responses['429']).toMatchObject({
        headers: {
          'Retry-After': {
            schema: { type: 'string', example: '5' },
          },
        },
      });
      const problemDetailsSchema =
        document.components?.schemas?.ProblemDetailsDto;
      expect(problemDetailsSchema).toBeDefined();
      if (!problemDetailsSchema || !('properties' in problemDetailsSchema)) {
        throw new Error('Problem Details schema has no properties');
      }
      expect(problemDetailsSchema.properties?.type).toMatchObject({
        type: 'string',
        enum: ['about:blank'],
        example: 'about:blank',
      });
      expect(operation.responses['200']).toMatchObject({
        content: {
          'application/json': {
            schema: {
              properties: {
                meta: {
                  properties: {
                    limit: { type: 'integer' },
                    nextCursor: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    hasMore: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/response-contract')
        .expect(200);
      expect(response).toSatisfyApiSpec();

      const rateLimited = await request(app.getHttpServer())
        .get('/response-contract/limited')
        .expect(429)
        .expect('Retry-After', '7');
      expect(rateLimited.headers['content-type']).toContain(
        'application/problem+json',
      );

      await request(app.getHttpServer())
        .get('/response-contract/limited-global')
        .expect(429)
        .expect('Retry-After', '11');

      await request(app.getHttpServer())
        .get('/response-contract/limited-fallback')
        .expect(429)
        .expect('Retry-After', '1');

      const unavailable = await request(app.getHttpServer())
        .get('/response-contract/unavailable')
        .expect(503)
        .expect('Retry-After', '5');
      expect(unavailable.body).toMatchObject({
        title: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });

      const invalidDomainValue = await request(app.getHttpServer())
        .get('/response-contract/domain-invalid')
        .expect(400);
      expect(invalidDomainValue.body).toMatchObject({
        code: 'BAD_REQUEST',
        detail: 'Book title cannot be empty',
      });
    } finally {
      await app.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }, 15_000);
});
