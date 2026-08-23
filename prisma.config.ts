import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bunx tsx prisma/seed/index.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || process.env['DATABASE_URL'] || '',
  },
});
