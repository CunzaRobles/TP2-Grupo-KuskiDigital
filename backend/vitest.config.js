import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        // Pruebas de la API con los repositorios simulados: no necesitan base de datos (CI).
        test: {
          name: 'unit',
          include: ['tests/**/*.test.js'],
          exclude: ['tests/integration/**'],
          setupFiles: ['tests/setup/mock-repositories.js'],
          mockReset: true,
        },
      },
      {
        // Pruebas contra Supabase: se omiten si no hay DATABASE_URL.
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.js'],
        },
      },
    ],
  },
});
