import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
}

describe('API response Swagger decorators', () => {
  it('documents cursor metadata and Problem Details error responses', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResponseContractController],
    }).compile();
    const app = moduleRef.createNestApplication();
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'socialbook-openapi-'),
    );

    try {
      await app.init();
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('response contract test').build(),
      );
      const specPath = join(temporaryDirectory, 'openapi.json');
      await writeFile(specPath, JSON.stringify(document), 'utf8');
      jestOpenAPI(specPath);
      const operation = document.paths['/response-contract'].get;
      if (!operation) throw new Error('Swagger operation was not generated');

      expect(operation.responses['400']).toBeDefined();
      expect(operation.responses['500']).toBeDefined();
      expect(document.components?.schemas?.ProblemDetailsDto).toBeDefined();
      expect(operation.responses['200']).toMatchObject({
        content: {
          'application/json': {
            schema: {
              properties: {
                meta: {
                  properties: {
                    limit: { type: 'integer' },
                    nextCursor: { type: 'string', nullable: true },
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
    } finally {
      await app.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
