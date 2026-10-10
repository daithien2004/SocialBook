import { createServer } from 'node:http';
import { once } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Agent } from 'undici';
import { ChromaConnectionFactory } from '@/modules/chroma/infrastructure/repositories/chroma-connection.factory';

describe('ChromaConnectionFactory', () => {
  it('aborts a stalled Chroma HTTP response using the configured header timeout', async () => {
    const configValues = new Map<string, string | number>([
      ['env.CHROMA_URL', 'http://localhost:8000'],
      ['env.CHROMA_COLLECTION', 'test-collection'],
      ['env.HUGGINGFACE_API_KEY', 'test-key'],
      ['env.CHROMA_CONNECT_TIMEOUT_MS', 1000],
      ['env.CHROMA_HEADERS_TIMEOUT_MS', 50],
      ['env.CHROMA_BODY_TIMEOUT_MS', 1000],
    ]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChromaConnectionFactory,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string | number) =>
              configValues.get(key) ?? defaultValue,
          },
        },
      ],
    }).compile();
    const factory = moduleRef.get(ChromaConnectionFactory);
    const vectorStore = factory.createVectorStore(
      factory.createEmbeddings(),
      'test-collection',
    );
    const fetchOptions = vectorStore.clientParams?.fetchOptions;
    if (
      !fetchOptions ||
      !('dispatcher' in fetchOptions) ||
      !(fetchOptions.dispatcher instanceof Agent)
    ) {
      throw new Error('Chroma vector store is missing its Undici dispatcher');
    }
    const dispatcher = fetchOptions.dispatcher;
    const nodeRequestOptions: RequestInit & { dispatcher: Agent } = {
      dispatcher,
    };
    const server = createServer(() => undefined);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Test server did not bind to a TCP port');
      }

      await expect(
        fetch(`http://127.0.0.1:${String(address.port)}`, nodeRequestOptions),
      ).rejects.toThrow();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      await moduleRef.close();
    }
  });
});
