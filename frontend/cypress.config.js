import { defineConfig } from 'cypress';

// Pruebas E2E contra la app real: frontend (Vite, 5173) + API (3000) + base de datos con los
// datos semilla. Arranca ambos con `npm run dev` antes de `npm run e2e`.
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 900,
    // La base de datos está en Supabase y la pasarela simulada tarda 1–2 s
    defaultCommandTimeout: 15_000,
    video: false,
    screenshotOnRunFailure: true,
  },
});
