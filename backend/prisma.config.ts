import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://socialbook:socialbook_dev@localhost:5432/socialbook?schema=public',
  },
});
