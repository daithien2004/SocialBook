import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChromaConnectionFactory } from '@/modules/chroma/infrastructure/repositories/chroma-connection.factory';
import { ChromaVectorRepository } from '@/modules/chroma/infrastructure/repositories/chroma-vector.repository';
import { VectorDocument } from '@/modules/chroma/domain/entities/vector-document.entity';

describe('ChromaVectorRepository idempotent writes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not write provider credentials or endpoint URLs to startup logs', async () => {
    const logMock = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const { moduleRef } = await createRepository();

    expect(logMock).not.toHaveBeenCalledWith(
      expect.stringContaining('test-key'),
    );
    expect(logMock).not.toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8000'),
    );
    await moduleRef.close();
  });

  it('uses the domain document ID for a single write', async () => {
    const { repository, vectorStore, moduleRef } = await createRepository();
    const document = createVectorDocument('vector-1');

    await repository.save(document);

    expect(vectorStore.addDocuments).toHaveBeenCalledWith(expect.any(Array), {
      ids: ['vector-1'],
    });
    await moduleRef.close();
  });

  it('keeps IDs stable when a failed batch is split into retries', async () => {
    const { repository, vectorStore, moduleRef } = await createRepository();
    vectorStore.addDocuments
      .mockRejectedValueOnce(new Error('Maximum batch size exceeded'))
      .mockResolvedValue([]);
    const documents = [
      createVectorDocument('vector-1'),
      createVectorDocument('vector-2'),
    ];

    const result = await repository.saveBatch(documents);

    expect(result).toMatchObject({
      totalProcessed: 2,
      successful: 2,
      failed: 0,
    });
    expect(vectorStore.addDocuments).toHaveBeenNthCalledWith(
      1,
      expect.any(Array),
      { ids: ['vector-1', 'vector-2'] },
    );
    expect(vectorStore.addDocuments).toHaveBeenNthCalledWith(
      2,
      expect.any(Array),
      { ids: ['vector-1'] },
    );
    expect(vectorStore.addDocuments).toHaveBeenNthCalledWith(
      3,
      expect.any(Array),
      { ids: ['vector-2'] },
    );
    await moduleRef.close();
  });

  it('does not fan out transport failures into more Chroma requests', async () => {
    const { repository, vectorStore, moduleRef } = await createRepository();
    vectorStore.addDocuments.mockRejectedValue(
      new Error('Failed to connect to Chroma'),
    );

    const result = await repository.saveBatch([
      createVectorDocument('vector-1'),
      createVectorDocument('vector-2'),
    ]);

    expect(result).toMatchObject({
      totalProcessed: 2,
      successful: 0,
      failed: 2,
    });
    expect(vectorStore.addDocuments).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });
});

async function createRepository() {
  const vectorStore = {
    addDocuments: jest.fn().mockResolvedValue([]),
  };
  const connectionFactory = {
    getHuggingFaceApiKey: () => 'test-key',
    createEmbeddings: () => ({}),
    getChromaUrl: () => 'http://localhost:8000',
    getCollectionName: () => 'test-collection',
    getCollectionMetadata: () => ({}),
    createChromaClient: () => ({
      getOrCreateCollection: jest.fn().mockResolvedValue({}),
    }),
    createVectorStore: () => vectorStore,
  };
  const moduleRef = await Test.createTestingModule({
    providers: [
      ChromaVectorRepository,
      { provide: ChromaConnectionFactory, useValue: connectionFactory },
    ],
  }).compile();
  const repository = moduleRef.get(ChromaVectorRepository);
  await repository.onModuleInit();

  return { repository, vectorStore, moduleRef };
}

function createVectorDocument(id: string): VectorDocument {
  return VectorDocument.create({
    id,
    contentId: `content-${id}`,
    contentType: 'book',
    content: `Content ${id}`,
    embedding: [0.1, 0.2],
  });
}
