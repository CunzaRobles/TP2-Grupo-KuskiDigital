import { defineConfig } from 'vitest/config';

// Pruebas contra la base real de Supabase (npm run test:integration).
// Se omiten si no hay DATABASE_URL en backend/.env.
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*-db.test.js'],
    testTimeout: 30000,
  },
});
