import { defineConfig } from 'vitest/config';

// Pruebas unitarias de la API: los repositorios están simulados (tests/setup/mock-repositories.js),
// así que nunca cargan los modelos de Sequelize ni se conectan a Supabase.
// Las pruebas contra la base real tienen su propia config: vitest.integration.config.js.
export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/integration/**'],
    setupFiles: ['tests/setup/mock-repositories.js'],
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.js'],
      // Solo se ejecutan contra la base real: no aplican a la cobertura unitaria.
      exclude: ['src/server.js', 'src/models/**', 'src/repositories/**', 'src/config/database.js'],
    },
  },
});
