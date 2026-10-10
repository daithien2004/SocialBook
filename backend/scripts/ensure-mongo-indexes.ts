import type { Connection } from 'mongoose';

async function ensureMongoIndexes(): Promise<void> {
  process.env.WORKER_MODE = 'false';
  process.env.NODE_ENV = 'production';

  const [{ NestFactory }, { AppModule }, { getConnectionToken }] =
    await Promise.all([
      import('@nestjs/core'),
      import('../src/app.module.js'),
      import('@nestjs/mongoose'),
    ]);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const modelNames = connection.modelNames().sort();

    for (const modelName of modelNames) {
      await connection.model(modelName).createIndexes();
      process.stdout.write(`Ensured indexes: ${modelName}\n`);
    }

    process.stdout.write(`Ensured indexes for ${modelNames.length} models.\n`);
  } finally {
    await app.close();
  }
}

void ensureMongoIndexes().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`MongoDB index setup failed: ${message}\n`);
  process.exitCode = 1;
});
