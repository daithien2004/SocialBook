import { resolve } from 'node:path';
import jestOpenAPI from 'jest-openapi';
import request from 'supertest';

const apiBaseUrl = process.env.OPENAPI_CONTRACT_API_URL;
const describeWhenApiIsRunning = apiBaseUrl ? describe : describe.skip;

describeWhenApiIsRunning('running API OpenAPI contract', () => {
  beforeAll(() => {
    jestOpenAPI(resolve(process.cwd(), 'openapi.json'));
  });

  it('matches the liveness response to the committed OpenAPI artifact', async () => {
    if (!apiBaseUrl) throw new Error('API contract base URL is required');

    const response = await request(apiBaseUrl)
      .get('/api/health/live')
      .expect(200);

    expect(response).toSatisfyApiSpec();
  });

  it('matches a paginated books response to the committed OpenAPI artifact', async () => {
    if (!apiBaseUrl) throw new Error('API contract base URL is required');

    const response = await request(apiBaseUrl)
      .get('/api/v1/books')
      .query({ limit: 1 })
      .expect(200);

    expect(response).toSatisfyApiSpec();
  });
});
